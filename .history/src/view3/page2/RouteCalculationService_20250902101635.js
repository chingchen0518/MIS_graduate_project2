// services/RouteCalculationService.js

class RouteCalculationService {
  constructor() {
    this.otpServerUrl = 'http://localhost:8080';
    
    // 預設交通方式配置
    this.defaultTransportModes = {
      walk: { 
        mode: 'WALK', 
        name: '步行',
        color: 'green'
      },
      bicycle: { 
        mode: 'BICYCLE', 
        name: '腳踏車',
        color: 'blue'
      },
      car: { 
        mode: 'CAR', 
        name: '汽車',
        color: 'red'
      },
      transit: { 
        mode: 'TRANSIT,WALK', 
        name: '大眾運輸',
        color: 'purple'
      }
    };
  }

  /*設定交通方式配置*/
  setTransportModes(transportModes) {
    this.transportModes = transportModes || this.defaultTransportModes;
  }

  /*獲取交通方式配置*/
  getTransportModes() {
    return this.transportModes || this.defaultTransportModes;
  }

  /*格式化日期為 OTP 格式 (MM-DD-YYYY)*/
  formatDateForOTP(date) {
    const [year, month, day] = date.split('-');
    return `${month}-${day}-${year}`;
  }

  /*單一路線計算（回到原本的多URL測試，但加強調試）*/
  async calculateRoute(fromCoords, toCoords, date, mode = 'WALK') {
    try {
      const fromPlace = `${fromCoords[0]},${fromCoords[1]}`; //起點的經緯度
      const toPlace = `${toCoords[0]},${toCoords[1]}`;//終點的經緯度
      const otpDate = this.formatDateForOTP(date);
      
      let urlVariants = [];
      
      if (mode === 'TRANSIT,WALK') {
        // 大眾運輸 - 根據測試結果，優先使用最簡化的參數
        urlVariants = [
          {
            name: 'minimal params (transit) - PRIORITY',
            url: `${this.otpServerUrl}/otp/routers/default/plan?` +
                 `fromPlace=${fromPlace}&toPlace=${toPlace}&mode=TRANSIT,WALK`
          }
          // ,
          // {
          //   name: 'default router (transit)',
          //   url: `${this.otpServerUrl}/otp/routers/default/plan?` +
          //        `fromPlace=${fromPlace}&toPlace=${toPlace}&` +
          //        `mode=TRANSIT,WALK&time=09:00am&date=${otpDate}&` +
          //        `maxWalkDistance=5000&numItineraries=3`
          // },
          // {
          //   name: 'switzerland router (transit optimized)',
          //   url: `${this.otpServerUrl}/otp/routers/switzerland/plan?` +
          //        `fromPlace=${fromPlace}&toPlace=${toPlace}&` +
          //        `mode=TRANSIT,WALK&time=09:00am&date=${otpDate}&` +
          //        `maxWalkDistance=5000&walkReluctance=1&` +
          //        `arriveBy=false&showIntermediateStops=true&` +
          //        `numItineraries=5&minTransferTime=30&` +
          //        `optimize=QUICK&walkSpeed=1.2&` +
          //        `transferPenalty=0&waitReluctance=1.0&` +
          //        `walkBoardCost=300&bikeBoardCost=300&` +
          //        `maxTransfers=4&clampInitialWait=0`
          // }
        ];
      } else {
        // 其他交通方式 - 採用 Hook 版本的成功策略
        const primaryUrl = `${this.otpServerUrl}/otp/routers/switzerland/plan?` +
                          `fromPlace=${fromPlace}&toPlace=${toPlace}&` +
                          `mode=${mode}&time=09:00&date=${otpDate}`;
        
        urlVariants = [
          {
            name: 'switzerland router (primary)',
            url: primaryUrl
          }
        ];
      }
      
      // 採用 Hook 版本的邏輯：先試主要 URL，失敗才試備用
      const primaryVariant = urlVariants[0];
      
      try {
        const response = await fetch(primaryVariant.url, {
          headers: { 'Accept': 'application/json' }
        });
        
        if (!response.ok) {
          // 如果是 404 且使用 switzerland router，嘗試 default router
          if (response.status === 404 && primaryVariant.url.includes('/switzerland/')) {
            const fallbackUrl = primaryVariant.url.replace('/switzerland/', '/default/');
            const fallbackResponse = await fetch(fallbackUrl, {
              headers: { 'Accept': 'application/json' }
            });
            
            if (fallbackResponse.ok) {
              const fallbackData = await fallbackResponse.json();
              
              // 檢查是否有路線
              if (fallbackData.plan?.itineraries?.length > 0) {
                // 檢查是否有幾何資料
                const hasGeometry = fallbackData.plan.itineraries[0].legs?.some(leg => 
                  leg.legGeometry?.points && leg.legGeometry.points.length > 20
                );
                
                return fallbackData;
              }
            }
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type');
        let data;
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          const jsonUrl = primaryVariant.url + (primaryVariant.url.includes('?') ? '&' : '?') + 'format=json';
          const jsonResponse = await fetch(jsonUrl, {
            headers: { 'Accept': 'application/json' }
          });
          if (jsonResponse.ok) {
            data = await jsonResponse.json();
          } else {
            throw new Error('無法獲取 JSON 格式回應');
          }
        }
        
        // 檢查是否有錯誤信息
        if (data.error) {
          if (mode === 'TRANSIT,WALK') {
            throw new Error(`大眾運輸計算失敗: ${data.error.message || 'GTFS 數據可能未載入'}`);
          }
          throw new Error(data.error.message || 'OTP 服務錯誤');
        }
        
        // 檢查是否有計劃資料
        if (!data.plan || !data.plan.itineraries || data.plan.itineraries.length === 0) {
          if (mode === 'TRANSIT,WALK') {
            throw new Error('大眾運輸無可行路線：可能是 GTFS 數據缺失或站點距離過遠');
          }
          
          throw new Error('沒有找到可行路線');
        }

        // 檢查是否有幾何資料
        const hasGeometry = data.plan.itineraries[0].legs?.some(leg => 
          leg.legGeometry?.points && leg.legGeometry.points.length > 20
        );
        
        return data;
        
      } catch (error) {
        throw error;
      }
      
      // 所有格式都失敗，創建後備路線
      return this.createFallbackRoute(fromCoords, toCoords, mode);
      
    } catch (error) {
      return this.createFallbackRoute(fromCoords, toCoords, mode);
    }
  }

  /*計算所有交通方式的路線*/
  async calculateAllRoutes(fromCoords, toCoords, date) {
    const transportModes = this.getTransportModes();
    const routeResults = {};
    
    for (const [key, transport] of Object.entries(transportModes)) {
      try {
        const route = await this.calculateRoute(fromCoords, toCoords, date, transport.mode);
        routeResults[key] = route;
      } catch (error) {
        routeResults[key] = null;
      }
    }
    
    return routeResults;
  }

  /*批次計算多段路線的所有交通方式*/
  async calculateAllRoutesForItinerary(itinerary, travelDate) {
    if (itinerary.length < 2) {
      throw new Error('請至少添加兩個景點！');
    }
    
    const allRouteData = [];
    const date = travelDate.replace(/-/g, '-');
    
    for (let i = 0; i < itinerary.length - 1; i++) {
      const from = itinerary[i];
      const to = itinerary[i + 1];
      
      try {
        const segmentRoutes = await this.calculateAllRoutes(from.coords, to.coords, date);
        allRouteData.push(segmentRoutes);
      } catch (error) {
        allRouteData.push({});
      }
    }
    
    return allRouteData;
  }

  /**
   * 計算兩點間距離 (km)
   */
  calculateDistance(coord1, coord2) {
    const R = 6371; // 地球半徑
    const dLat = (coord2[0] - coord1[0]) * Math.PI / 180;
    const dLon = (coord2[1] - coord1[1]) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(coord1[0] * Math.PI / 180) * Math.cos(coord2[0] * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /*找出最快的交通方式*/
  findFastestRoute(routeResults) {
    let fastestTime = Infinity;
    let fastestMode = null;
    
    Object.entries(routeResults).forEach(([key, data]) => {
      if (data?.plan?.itineraries?.[0]) {
        const duration = data.plan.itineraries[0].duration;
        if (duration < fastestTime) {
          fastestTime = duration;
          fastestMode = key;
        }
      }
    });
    
    return fastestMode;
  }

  /*獲取路線摘要資訊*/
  getRouteSummary(routeData) {
    if (!routeData?.plan?.itineraries?.[0]) {
      return null;
    }
    
    const itinerary = routeData.plan.itineraries[0];
    
    // 計算總距離
    let totalDistance = 0;
    
    if (itinerary.legs && itinerary.legs.length > 0) {
      // 計算所有路段的距離總和
      totalDistance = itinerary.legs.reduce((total, leg) => {
        return total + (leg.distance || 0);
      }, 0);
      // 轉換為公里
      totalDistance = totalDistance / 1000;
    } else if (itinerary.walkDistance) {
      // 後備方案：使用步行距離
      totalDistance = itinerary.walkDistance / 1000;
    } else if (routeData.fallback) {
      // 如果是後備路線，使用直線距離
      const legs = itinerary.legs || [];
      if (legs.length > 0) {
        const fromCoords = [legs[0].from.lat, legs[0].from.lon];
        const toCoords = [legs[legs.length - 1].to.lat, legs[legs.length - 1].to.lon];
        totalDistance = this.calculateDistance(fromCoords, toCoords);
      }
    }
    
    // 如果距離仍然是 0，使用座標計算直線距離
    if (totalDistance === 0 && itinerary.legs && itinerary.legs.length > 0) {
      const firstLeg = itinerary.legs[0];
      const lastLeg = itinerary.legs[itinerary.legs.length - 1];
      if (firstLeg.from && lastLeg.to) {
        const fromCoords = [firstLeg.from.lat, firstLeg.from.lon];
        const toCoords = [lastLeg.to.lat, lastLeg.to.lon];
        totalDistance = this.calculateDistance(fromCoords, toCoords);
      }
    }
    
    return {
      duration: Math.round(itinerary.duration / 60), // 分鐘
      distance: totalDistance.toFixed(1), // 公里
      startTime: new Date(itinerary.startTime).toLocaleTimeString(),
      endTime: new Date(itinerary.endTime).toLocaleTimeString(),
      transfers: itinerary.transfers || 0,
      isFallback: routeData.fallback || false
    };
  }

  /*獲取支援的交通模式*/
  async getSupportedModes() {
    try {
      const response = await fetch(`${this.otpServerUrl}/otp/routers/switzerland`);
      if (response.ok) {
        const routerInfo = await response.json();
        return routerInfo.transitModes || ['WALK', 'TRANSIT'];
      }
    } catch (error) {
      console.error('無法獲取支援的交通模式:', error);
    }
    
    // 返回默認支援的模式
    return ['WALK', 'TRANSIT', 'BICYCLE', 'CAR'];
  }
}

// 導出單例實例
export const routeService = new RouteCalculationService();