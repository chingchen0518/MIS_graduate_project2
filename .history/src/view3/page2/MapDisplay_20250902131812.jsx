import React, { useEffect, useRef, useState } from 'react';
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
  const mapRef = useRef(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [routeData, setRouteData] = useState({});
  const [activeTransport, setActiveTransport] = useState('walk');
  const [routeSummaries, setRouteSummaries] = useState({});
  const [scheduleRouteData, setScheduleRouteData] = useState(null);

  // 測試用的起點和終點
  const testLocations = {
    zurich: { name: '蘇黎世', coords: [47.3769, 8.5417] },
    luzern: { name: '琉森', coords: [47.0502, 8.3093] }
  };

  // 初始化地圖 - 只在組件掛載時執行一次
  useEffect(() => {
    if (mapRef.current && !mapService.map) {
      try {
        // 設定交通方式配置
        routeService.setTransportModes(transportModes);

        // 初始化地圖 (使用全球配置)
        mapService.initMap(mapRef.current, {}, 'global');

      } catch (error) {
        // Error handling without console output
      }
    }
  }, []); // 只在組件掛載時執行一次

  // 組件卸載時清理地圖
  useEffect(() => {
    return () => {
      try {
        if (mapService && typeof mapService.destroy === 'function') {
          mapService.destroy();
        }
      } catch (error) {
        // Error handling without console output
      }
    };
  }, []);

  // 處理選中景點的顯示
  useEffect(() => {
    if (selectedAttraction && mapRef.current && mapService.map) {
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
            return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
          }
          return null;
        } catch (error) {
          return null;
        }
      };

      // 獲取座標並顯示標記
      const displayAttraction = async () => {
        let coords;

        // 如果景點有座標資料
        if (selectedAttraction.latitude && selectedAttraction.longitude) {
          coords = [parseFloat(selectedAttraction.latitude), parseFloat(selectedAttraction.longitude)];
        } else if (selectedAttraction.address) {
          // 使用地址進行地理編碼
          coords = await geocodeAttraction(selectedAttraction.address);
        }

        // 如果還是沒有座標，使用台北市中心點
        if (!coords) {
          coords = [25.0330, 121.5654]; // 台北市中心點
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
        const offsetCoords = [coords[0] + 0.005, coords[1]];
        mapService.map.setView(offsetCoords, 13);
      };

      displayAttraction();
    }
  }, [selectedAttraction]);

  // 處理行程路線顯示
  useEffect(() => {
    if (currentRoute && currentRoute.attractions && currentRoute.attractions.length > 0 && mapService.map) {
      console.log('🗺️ MapDisplay 處理路線顯示:', currentRoute);
      
      // 清除現有的路線標記和線條
      mapService.clearRoutes();
      
      // 處理景點標記
      const validAttractions = currentRoute.attractions.filter(attraction => 
        attraction.latitude && attraction.longitude
      );
      
      if (validAttractions.length === 0) {
        console.log('⚠️ 沒有有效的景點座標');
        return;
      }

      // 添加景點標記
      validAttractions.forEach((attraction, index) => {
        const coords = [parseFloat(attraction.latitude), parseFloat(attraction.longitude)];
        mapService.addMarker(`route-attraction-${attraction.id}`, coords, {
          title: `${attraction.sequence || index + 1}. ${attraction.name}`,
          popup: `
            <div style="font-family: Arial, sans-serif; min-width: 150px;">
              <h4 style="margin: 0; color: #333;">${attraction.sequence || index + 1}. ${attraction.name}</h4>
              <p style="margin: 2px 0; font-size: 11px; color: #666;">${attraction.category || '景點'}</p>
              <p style="margin: 2px 0; font-size: 10px; color: #999;">${attraction.address || ''}</p>
            </div>
          `,
          zIndexOffset: 1000
        });
      });

      // 計算並顯示路線
      const calculateRouteSequence = async () => {
        setIsCalculating(true);
        
        try {
          // 按 sequence 排序景點
          const sortedAttractions = [...validAttractions].sort((a, b) => 
            (a.sequence || 0) - (b.sequence || 0)
          );

          // 計算連續景點間的路線
          for (let i = 0; i < sortedAttractions.length - 1; i++) {
            const start = sortedAttractions[i];
            const end = sortedAttractions[i + 1];
            
            const startCoords = [parseFloat(start.latitude), parseFloat(start.longitude)];
            const endCoords = [parseFloat(end.latitude), parseFloat(end.longitude)];

            try {
              // 使用步行模式計算路線
              const routeResult = await routeService.calculateRoute(
                startCoords, 
                endCoords, 
                'walk',
                '2024-07-15'
              );

              if (routeResult && routeResult.coordinates) {
                // 添加路線到地圖
                mapService.addRoute(`schedule-route-${i}`, routeResult.coordinates, {
                  color: '#2196F3',
                  weight: 4,
                  opacity: 0.7
                });
              }
            } catch (routeError) {
              console.log(`景點 ${start.name} 到 ${end.name} 的路線計算失敗`);
              // 如果路線計算失敗，直接畫直線
              mapService.addRoute(`schedule-route-${i}`, [startCoords, endCoords], {
                color: '#FF9800',
                weight: 3,
                opacity: 0.5,
                dashArray: '5, 10'
              });
            }
          }

          // 調整地圖視野包含所有景點
          const allCoords = validAttractions.map(attraction => 
            [parseFloat(attraction.latitude), parseFloat(attraction.longitude)]
          );
          
          if (allCoords.length > 1) {
            mapService.fitBounds(allCoords);
          } else if (allCoords.length === 1) {
            mapService.map.setView(allCoords[0], 13);
          }

        } catch (error) {
          console.log('路線計算過程發生錯誤');
        } finally {
          setIsCalculating(false);
        }
      };

      calculateRouteSequence();
      
    } else if (!currentRoute && mapService.map) {
      // 如果沒有路線資料，清除現有路線
      mapService.clearRoutes();
    }
  }, [currentRoute]);

  // 計算所有交通方式的路線
  const calculateAllRoutes = async () => {
    setIsCalculating(true);
    try {
      const date = '2024-07-15';

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


    } catch (error) {
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