import React, { useEffect, useRef, useState } from 'react';
import { mapService } from './MapService.js';
import { routeService } from './RouteCalculationService.js';
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

const MapDisplay = ({ selectedAttraction }) => {
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
        const offsetCoords = [coords[0] + 0.005, coords[1]];
        mapService.map.setView(offsetCoords, 13);
      };
      
      displayAttraction();
    }
  }, [selectedAttraction]);

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