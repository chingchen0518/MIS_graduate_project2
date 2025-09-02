import React, { useEffect, useRef, useState, useContext } from 'react';
import { SelectedScheduleContext } from '../../chingchen/page1.jsx';
import { mapService } from './services/MapService.js';
import { routeService } from './services/RouteCalculationService.js';
import './MapDisplay.css';

// 交通方式配置（內建）
const transportModes = {
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

const MapDisplay = ({ selectedAttraction, currentRoute }) => {
  const { selectedScheduleId } = useContext(SelectedScheduleContext);
  const mapRef = useRef(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [routeData, setRouteData] = useState({});
  const [activeTransport, setActiveTransport] = useState('walk');
  const [routeSummaries, setRouteSummaries] = useState({});

  // 測試用的起點和終點
  const testLocations = {
    zurich: { name: '蘇黎世', coords: [47.3769, 8.5417] },
    luzern: { name: '琉森', coords: [47.0502, 8.3093] }
  };

  useEffect(() => {
    if (selectedScheduleId !== null) {
      console.log(`selected schedule id ${selectedScheduleId} in Map Display`);
    }
    
    // 只在組件首次掛載時初始化地圖
    if (mapRef.current && !mapService.map) {
      console.log('初始化地圖...');
      try {
        // 設定交通方式配置
        routeService.setTransportModes(transportModes);
        
        // 初始化地圖 (使用全球配置)
        mapService.initMap(mapRef.current, {}, 'global');
        
        console.log('地圖初始化完成');
      } catch (error) {
        console.error('地圖初始化失敗:', error);
      }
    }
  }, []); // 移除依賴，只在組件掛載時執行一次

  // 組件卸載時清理地圖
  useEffect(() => {
    return () => {
      try {
        if (mapService && typeof mapService.destroy === 'function') {
          mapService.destroy();
          console.log('地圖已清理');
        }
      } catch (error) {
        console.error('地圖清理失敗:', error);
      }
    };
  }, []);

  // 處理選中景點的顯示
  useEffect(() => {
    if (selectedAttraction && mapRef.current && mapService.map) {
      // 清除所有路線相關的標記和路線
      for (let i = 0; i < 20; i++) {
        mapService.removeMarker(`route-attraction-${i}`);
      }
      mapService.clearRoutes();
      
      // 移除之前的景點標記
      mapService.removeMarker('selected-attraction');
      
      // 地理編碼函數
      const geocodeAttraction = async (address) => {
        try {
          // 使用 Nominatim API 進行地理編碼 (不限制國家)
          const query = encodeURIComponent(address);
          const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1&addressdetails=1`);
          const data = await response.json();
          
          if (data && data.length > 0) {
            console.log('地理編碼結果:', data[0]);
            return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
          }
          return null;
        } catch (error) {
          console.error('地理編碼失敗:', error);
          return null;
        }
      };
      
      // 獲取座標並顯示標記
      const displayAttraction = async () => {
        let coords;
        console.log('選中的景點:', selectedAttraction);
        
        // 如果景點有座標資料
        if (selectedAttraction.latitude && selectedAttraction.longitude) {
          coords = [parseFloat(selectedAttraction.latitude), parseFloat(selectedAttraction.longitude)];
          console.log('使用景點座標:', coords);
        } else if (selectedAttraction.address) {
          console.log('開始地理編碼:', selectedAttraction.address);
          // 使用地址進行地理編碼
          coords = await geocodeAttraction(selectedAttraction.address);
          if (coords) {
            console.log('地理編碼成功:', coords);
          } else {
            console.log('地理編碼失敗，使用預設座標');
          }
        }
        
        // 如果還是沒有座標，使用台北市中心點
        if (!coords) {
          coords = [25.0330, 121.5654]; // 台北市中心點
          console.log('使用預設座標 (台北):', coords);
        }
        
        // 添加景點標記 - 使用原本測試用的預設地標樣式
        mapService.addMarker('selected-attraction', coords, {
          title: selectedAttraction.name,
          popup: `
            <div style="font-family: Arial, sans-serif; min-width: 150px;">
              <h4 style="margin: 0; color: #333;">${selectedAttraction.name}</h4>
              <p style="margin: 2px 0; font-size: 11px; color: #666;">${selectedAttraction.category || '景點'}</p>
            </div>
          `
        });
        
        // 將地圖視野置中到該景點，但向上偏移避免被詳細資訊卡片遮擋
        // 計算偏移量（向北偏移約 0.005 度，大約 550 米）
        const offsetCoords = [coords[0] - 0.007, coords[1]];
        mapService.map.setView(offsetCoords, 13);
      };
      
      displayAttraction();
    }
  }, [selectedAttraction]);

  // 處理路線顯示
  useEffect(() => {
    if (currentRoute && mapRef.current && mapService.map) {
      console.log('顯示路線景點:', currentRoute);
      
      // 清除單個景點標記
      mapService.removeMarker('selected-attraction');
      
      // 清除之前的路線標記和路線
      currentRoute.attractions?.forEach((_, index) => {
        mapService.removeMarker(`route-attraction-${index}`);
      });
      mapService.clearRoutes(); // 清除之前的路線
      
      if (currentRoute.attractions && currentRoute.attractions.length > 0) {
        const validAttractions = [];
        
        // 添加每個景點的標記
        currentRoute.attractions.forEach((attraction, index) => {
          if (attraction.latitude && attraction.longitude) {
            const coords = [parseFloat(attraction.latitude), parseFloat(attraction.longitude)];
            
            // 創建帶有序號的圖標
            const sequenceIcon = mapService.createSequenceIcon(attraction.sequence || (index + 1));
            
            // 添加標記
            mapService.addMarker(`route-attraction-${index}`, coords, {
              title: attraction.name,
              icon: sequenceIcon,
              popup: `
                <div style="font-family: Arial, sans-serif; min-width: 150px;">
                  <h4 style="margin: 0; color: #333; font-size: 14px;">${attraction.name}</h4>
                  <p style="margin: 2px 0; font-size: 11px; color: #666;">順序: ${attraction.sequence || (index + 1)}</p>
                  <p style="margin: 2px 0; font-size: 11px; color: #666;">${attraction.category || '景點'}</p>
                  <p style="margin: 2px 0; font-size: 10px; color: #888;">路線: ${currentRoute.title}</p>
                </div>
              `
            });
            
            validAttractions.push({
              coords,
              name: attraction.name,
              sequence: attraction.sequence
            });
          }
        });
        
        // 計算並顯示景點之間的路線
        if (validAttractions.length > 1) {
          calculateRoutesBetweenAttractions(validAttractions);
        }
        
        // 如果有有效的景點，調整地圖視野以包含所有景點
        if (validAttractions.length > 0) {
          try {
            // 計算邊界
            const latitudes = validAttractions.map(attr => attr.coords[0]);
            const longitudes = validAttractions.map(attr => attr.coords[1]);
            const minLat = Math.min(...latitudes);
            const maxLat = Math.max(...latitudes);
            const minLng = Math.min(...longitudes);
            const maxLng = Math.max(...longitudes);
            
            // 設置地圖邊界
            mapService.map.fitBounds([
              [minLat, minLng],
              [maxLat, maxLng]
            ], {
              padding: [20, 20]
            });
          } catch (error) {
            console.error('調整地圖視野失敗:', error);
            // 如果失敗，至少置中到第一個景點
            if (validAttractions.length > 0) {
              mapService.map.setView(validAttractions[0].coords, 12);
            }
          }
        }
      }
    } else if (!currentRoute && mapRef.current && mapService.map) {
      // 如果currentRoute為null，清除所有路線標記和路線
      console.log('清除路線標記和路線');
      // 清除所有路線標記
      for (let i = 0; i < 20; i++) {
        mapService.removeMarker(`route-attraction-${i}`);
      }
      // 清除所有路線段
      for (let i = 0; i < 20; i++) {
        if (mapService.routeLines && mapService.routeLines.has(`attraction-route-${i}`)) {
          const routeLine = mapService.routeLines.get(`attraction-route-${i}`);
          if (routeLine && mapService.map) {
            mapService.map.removeLayer(routeLine);
          }
          mapService.routeLines.delete(`attraction-route-${i}`);
        }
      }
    }
  }, [currentRoute]);

  // 計算景點之間的路線
  const calculateRoutesBetweenAttractions = async (attractions) => {
    try {
      console.log('開始計算景點之間的路線...');
      const routePromises = [];
      const date = new Date().toISOString().split('T')[0]; // 今天的日期 YYYY-MM-DD
      
      // 按序列排序景點
      const sortedAttractions = attractions.sort((a, b) => a.sequence - b.sequence);
      
      // 為每對相鄰景點計算路線
      for (let i = 0; i < sortedAttractions.length - 1; i++) {
        const fromAttraction = sortedAttractions[i];
        const toAttraction = sortedAttractions[i + 1];
        
        console.log(`計算路線: ${fromAttraction.name} → ${toAttraction.name}`);
        
        // 使用步行模式計算路線（您可以根據需要修改交通方式）
        const routePromise = routeService.calculateRoute(
          fromAttraction.coords,
          toAttraction.coords,
          date,
          'WALK'
        ).then(routeData => {
          if (routeData) {
            return {
              from: fromAttraction,
              to: toAttraction,
              routeData,
              segmentId: `segment-${i}`
            };
          }
          return null;
        }).catch(error => {
          console.warn(`路線計算失敗 ${fromAttraction.name} → ${toAttraction.name}:`, error.message);
          // 創建簡單的直線路線作為後備
          return {
            from: fromAttraction,
            to: toAttraction,
            routeData: {
              plan: {
                itineraries: [{
                  legs: [{
                    legGeometry: {
                      points: `${fromAttraction.coords[0]},${fromAttraction.coords[1]};${toAttraction.coords[0]},${toAttraction.coords[1]}`
                    }
                  }]
                }]
              },
              isFallback: true
            },
            segmentId: `segment-${i}`
          };
        });
        
        routePromises.push(routePromise);
      }
      
      // 等待所有路線計算完成
      const routeResults = await Promise.all(routePromises);
      
      // 在地圖上顯示路線
      routeResults.forEach((result, index) => {
        if (result && result.routeData) {
          try {
            const routeType = result.routeData.isFallback ? '直線路線' : 'OTP路線';
            console.log(`顯示路線段 ${index + 1} (${routeType}):`, result.from.name, '→', result.to.name);
            
            // 提取路線座標
            const coordinates = mapService.extractRouteCoordinates(result.routeData);
            
            if (coordinates.length > 0) {
              // 使用mapService顯示路線
              const routeId = `attraction-route-${index}`;
              const routeStyle = {
                color: result.routeData.isFallback ? '#FF6B6B' : '#4285f4', // 後備路線用紅色，正常路線用藍色
                weight: result.routeData.isFallback ? 3 : 4,
                opacity: result.routeData.isFallback ? 0.6 : 0.8,
                dashArray: result.routeData.isFallback ? '10, 5' : null // 後備路線用虛線
              };
              
              mapService.drawRoute(coordinates, routeStyle, routeId);
              
              console.log(`路線段 ${index + 1} 顯示成功 (${routeType})，包含 ${coordinates.length} 個座標點`);
            } else {
              console.warn(`路線段 ${index + 1} 沒有有效的座標數據`);
            }
            
          } catch (drawError) {
            console.error(`顯示路線段失敗:`, drawError);
          }
        }
      });
      
      console.log('景點路線計算和顯示完成');
      
    } catch (error) {
      console.error('計算景點路線失敗:', error);
    }
  };

  // 計算所有交通方式的路線
  const calculateAllRoutes = async () => {
    setIsCalculating(true);
    try {
      const date = '2024-07-15';
      
      console.log('開始計算所有交通方式路線...');
      const allRoutes = await routeService.calculateAllRoutes(
        testLocations.zurich.coords,
        testLocations.luzern.coords,
        date
      );
      
      setRouteData(allRoutes);
      
      // 計算路線摘要
      const summaries = {};
      Object.entries(allRoutes).forEach(([key, data]) => {
        summaries[key] = routeService.getRouteSummary(data);
      });
      setRouteSummaries(summaries);
      
      // 在地圖上顯示所有路線
      mapService.drawMultipleRoutes(allRoutes, 'test_route');
      
      // 找出最快的交通方式並設為預設顯示
      const fastest = routeService.findFastestRoute(allRoutes);
      if (fastest) {
        setActiveTransport(fastest);
        mapService.toggleRouteVisibility('test_route', fastest);
      }
      
      console.log('所有路線計算完成！');
      
    } catch (error) {
      console.error('路線計算失敗:', error);
      alert(`路線計算失敗：${error.message}`);
    } finally {
      setIsCalculating(false);
    }
  };

  // 切換顯示的交通方式
  const handleTransportChange = (transportKey) => {
    setActiveTransport(transportKey);
    mapService.toggleRouteVisibility('test_route', transportKey);
  };

  // 清除所有路線
  const clearRoutes = () => {
    mapService.clearRoutes();
    setRouteData({});
    setRouteSummaries({});
    setActiveTransport('walk');
  };

  return (
    <div className="map-display">
      {/* <h2>交通方式</h2> */}
      
      {/* 控制按鈕 */}
      {/* <div className="control-buttons">
        <button 
          onClick={calculateAllRoutes}
          disabled={isCalculating}
          className={`control-button primary ${isCalculating ? 'loading' : ''}`}
        >
          {isCalculating ? '計算中...' : '計算所有路線'}
        </button>
        
        <button 
          onClick={clearRoutes}
          disabled={isCalculating}
          className="control-button danger"
        > */}
          {/* 清除路線 */}
        {/* </button>
      </div> */}

      {/* 交通方式選擇器 */}
      {Object.keys(routeData).length > 0 && (
        <div className="transport-selector">
          {/* <h3>選擇交通方式：</h3> */}
          <div className="transport-buttons">
            {Object.entries(transportModes).map(([key, transport]) => {
              const isActive = activeTransport === key;
              const hasData = routeData[key] && !routeData[key].error;
              const summary = routeSummaries[key];
              
              return (
                <button
                  key={key}
                  onClick={() => handleTransportChange(key)}
                  disabled={!hasData}
                  className={`transport-button ${key} ${isActive ? 'active' : 'inactive'}`}
                >
                  <div className="transport-button-content">
                    <div className="transport-button-name">{transport.name}</div>
                    {summary && (
                      <div className="transport-button-duration">
                        {summary.duration} 分鐘
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 路線詳細資訊 */}
      {routeSummaries[activeTransport] && (
        <div 
          className="route-details"
          style={{ borderColor: transportModes[activeTransport].color }}
        >
          <h4>{transportModes[activeTransport].name} 路線詳情</h4>
          <div className="route-details-grid">
            <div className="route-details-item">
              <strong>時間：</strong>{routeSummaries[activeTransport].duration} 分鐘
            </div>
            <div className="route-details-item">
              <strong>距離：</strong>{routeSummaries[activeTransport].distance} 公里
            </div>
            <div className="route-details-item">
              <strong>出發：</strong>{routeSummaries[activeTransport].startTime}
            </div>
            <div className="route-details-item">
              <strong>抵達：</strong>{routeSummaries[activeTransport].endTime}
            </div>
            {routeSummaries[activeTransport].transfers > 0 && (
              <div className="route-details-item">
                <strong>轉乘：</strong>{routeSummaries[activeTransport].transfers} 次
              </div>
            )}
          </div>
        </div>
      )}

      {/* 地圖容器 */}
      <div ref={mapRef} className="map-container" />

    </div>
  );
};

export default MapDisplay;