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
            console.log(`計算 ${mode} 路線...`, { fromCoords, toCoords, date, mode });

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
                console.log(`🔍 嘗試 ${primaryVariant.name}: ${primaryVariant.url}`);

                const response = await fetch(primaryVariant.url, {
                    headers: { 'Accept': 'application/json' },
                    timeout: 10000 // 10秒超時
                });

                if (!response.ok) {
                    console.warn(`📊 API 回應錯誤: ${response.status} ${response.statusText}`);

                    // 如果是 404 且使用 switzerland router，嘗試 default router
                    if (response.status === 404 && primaryVariant.url.includes('/switzerland/')) {
                        console.log('🔄 嘗試使用 default router...');
                        const fallbackUrl = primaryVariant.url.replace('/switzerland/', '/default/');
                        const fallbackResponse = await fetch(fallbackUrl, {
                            headers: { 'Accept': 'application/json' }
                        });

                        if (fallbackResponse.ok) {
                            const fallbackData = await fallbackResponse.json();
                            console.log(`✅ ${mode} fallback 成功:`, fallbackData);

                            // 檢查是否有路線
                            if (fallbackData.plan?.itineraries?.length > 0) {
                                console.log(`🎯 路線數量: ${fallbackData.plan.itineraries.length}`);
                                console.log(`⏱️ 第一條路線時間: ${Math.round(fallbackData.plan.itineraries[0].duration / 60)} 分鐘`);

                                // 檢查是否有幾何資料
                                const hasGeometry = fallbackData.plan.itineraries[0].legs?.some(leg =>
                                    leg.legGeometry?.points && leg.legGeometry.points.length > 20
                                );
                                console.log(`🗺️ 是否有詳細幾何資料: ${hasGeometry ? '是（真實路線）' : '否（可能是直線）'}`);

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

                console.log(`📝 ${mode} 路線結果:`, data);

                // 檢查是否有錯誤信息
                if (data.error) {
                    console.error(`⚠️ OTP 錯誤:`, data.error);
                    if (mode === 'TRANSIT,WALK') {
                        console.error('🚌 大眾運輸錯誤詳情:', data.error);
                        throw new Error(`大眾運輸計算失敗: ${data.error.message || 'GTFS 數據可能未載入'}`);
                    }
                    throw new Error(data.error.message || 'OTP 服務錯誤');
                }

                // 檢查是否有計劃資料
                if (!data.plan || !data.plan.itineraries || data.plan.itineraries.length === 0) {
                    console.warn(`⚠️ ${mode} 沒有找到可行路線`);
                    console.log('📄 完整回應數據:', JSON.stringify(data, null, 2));

                    if (mode === 'TRANSIT,WALK') {
                        throw new Error('大眾運輸無可行路線：可能是 GTFS 數據缺失或站點距離過遠');
                    }

                    throw new Error('沒有找到可行路線');
                }

                // 檢查是否有幾何資料
                const hasGeometry = data.plan.itineraries[0].legs?.some(leg =>
                    leg.legGeometry?.points && leg.legGeometry.points.length > 20
                );
                console.log(`🗺️ 是否有詳細幾何資料: ${hasGeometry ? '是（真實路線）' : '否（可能是直線）'}`);

                return data;

            } catch (error) {
                // 檢查是否為網路連接錯誤
                if (error.name === 'TypeError' && error.message.includes('fetch')) {
                    console.warn(`🌐 無法連接到 OTP 服務 (${mode})，使用直線路線`);
                } else if (error.message === 'PATH_NOT_FOUND') {
                    console.warn(`🛤️ ${mode} 模式找不到路線，使用直線路線`);
                } else {
                    console.error(`💥 ${mode} 路線計算失敗:`, error.message);
                }

                // 使用後備路線
                return this.createFallbackRoute(fromCoords, toCoords, mode);
            }

            // 所有格式都失敗，創建後備路線
            console.log(`🔄 ${mode} 所有 URL 格式都失敗，創建直線路線`);
            return this.createFallbackRoute(fromCoords, toCoords, mode);

        } catch (error) {
            console.warn(`🔄 ${mode} 路線計算完全失敗，使用後備路線:`, error.message);
            return this.createFallbackRoute(fromCoords, toCoords, mode);
        }
    }

    /*計算所有交通方式的路線*/
    async calculateAllRoutes(fromCoords, toCoords, date) {
        const transportModes = this.getTransportModes();
        const routeResults = {};

        console.log(`開始計算所有交通方式路線: [${fromCoords}] → [${toCoords}]`);

        for (const [key, transport] of Object.entries(transportModes)) {
            try {
                console.log(`計算 ${transport.name} 路線...`);
                const route = await this.calculateRoute(fromCoords, toCoords, date, transport.mode);
                routeResults[key] = route;
                console.log(`${transport.name} 路線計算成功`);
            } catch (error) {
                console.error(`${transport.name} 路線計算錯誤:`, error.message);
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

        console.log(`開始計算行程路線，共 ${itinerary.length - 1} 段`);

        for (let i = 0; i < itinerary.length - 1; i++) {
            const from = itinerary[i];
            const to = itinerary[i + 1];

            console.log(`計算第 ${i + 1} 段: ${from.name} → ${to.name}`);

            try {
                const segmentRoutes = await this.calculateAllRoutes(from.coords, to.coords, date);
                allRouteData.push(segmentRoutes);
            } catch (error) {
                console.error(`第 ${i + 1} 段路線計算失敗:`, error);
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
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(coord1[0] * Math.PI / 180) * Math.cos(coord2[0] * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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

    /*創建後備路線（直線路線）*/
    createFallbackRoute(fromCoords, toCoords, mode = 'WALK') {
        console.log(`創建後備路線: ${mode} 模式，從 [${fromCoords}] 到 [${toCoords}]`);

        // 計算直線距離
        const distance = this.calculateDistance(fromCoords, toCoords) * 1000; // 轉為公尺

        // 根據交通方式估算時間（秒）
        let estimatedDuration;
        switch (mode) {
            case 'WALK':
                estimatedDuration = (distance / 1.4) * 1000; // 步行速度 1.4 m/s
                break;
            case 'BICYCLE':
                estimatedDuration = (distance / 4.17) * 1000; // 自行車速度 15 km/h
                break;
            case 'CAR':
                estimatedDuration = (distance / 13.89) * 1000; // 汽車速度 50 km/h
                break;
            case 'TRANSIT,WALK':
            default:
                estimatedDuration = (distance / 8.33) * 1000; // 大眾運輸平均速度 30 km/h
                break;
        }

        // 創建符合OTP格式的後備路線數據
        const fallbackRoute = {
            plan: {
                itineraries: [{
                    duration: Math.round(estimatedDuration),
                    walkTime: mode === 'WALK' ? Math.round(estimatedDuration) : 0,
                    walkDistance: mode === 'WALK' ? distance : 100, // 最少100公尺步行
                    legs: [{
                        mode: mode.split(',')[0], // 取主要模式
                        from: {
                            lat: fromCoords[0],
                            lon: fromCoords[1],
                            name: '起點'
                        },
                        to: {
                            lat: toCoords[0],
                            lon: toCoords[1],
                            name: '終點'
                        },
                        legGeometry: {
                            points: `${fromCoords[0]},${fromCoords[1]};${toCoords[0]},${toCoords[1]}`,
                            length: 2
                        },
                        duration: Math.round(estimatedDuration),
                        distance: distance,
                        startTime: Date.now(),
                        endTime: Date.now() + estimatedDuration
                    }]
                }],
                from: {
                    lat: fromCoords[0],
                    lon: fromCoords[1],
                    name: '起點'
                },
                to: {
                    lat: toCoords[0],
                    lon: toCoords[1],
                    name: '終點'
                }
            },
            isFallback: true // 標記為後備路線
        };

        console.log(`後備路線創建完成: ${Math.round(estimatedDuration / 60)} 分鐘, ${(distance / 1000).toFixed(1)} 公里`);
        return fallbackRoute;
    }
}

// 導出單例實例
export const routeService = new RouteCalculationService();
