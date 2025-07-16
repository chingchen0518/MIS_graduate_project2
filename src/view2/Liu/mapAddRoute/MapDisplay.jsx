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

const MapDisplay = () => {
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
    if (mapRef.current) {
      console.log('初始化地圖...');
      try {
        // 設定交通方式配置
        routeService.setTransportModes(transportModes);
        
        // 初始化地圖
        mapService.initMap(mapRef.current);
        
        // 添加測試標記
        mapService.addMarker('zurich', testLocations.zurich.coords, {
          title: testLocations.zurich.name,
          popup: `<strong>${testLocations.zurich.name}</strong><br>起點`
        });
        
        mapService.addMarker('luzern', testLocations.luzern.coords, {
          title: testLocations.luzern.name,
          popup: `<strong>${testLocations.luzern.name}</strong><br>終點`
        });
        
        // 適應視野
        mapService.fitBounds([
          testLocations.zurich.coords,
          testLocations.luzern.coords
        ]);
        
        console.log('地圖初始化完成');
      } catch (error) {
        console.error('地圖初始化失敗:', error);
      }
      
      return () => {
        try {
          mapService.destroy();
        } catch (error) {
          console.error('地圖清理失敗:', error);
        }
      };
    }
  }, []);

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
      <h2>交通方式</h2>
      
      {/* 控制按鈕 */}
      <div className="control-buttons">
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
        >
          清除路線
        </button>
      </div>

      {/* 交通方式選擇器 */}
      {Object.keys(routeData).length > 0 && (
        <div className="transport-selector">
          <h3>選擇交通方式：</h3>
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
      
      {/* 說明資訊 */}
      <div className="info-section">
        <p><strong>測試路線：</strong> 蘇黎世 → 琉森</p>
      </div>
    </div>
  );
};

export default MapDisplay;