// services/MapService.js
import L from 'leaflet';

// 修復 Leaflet 圖標問題
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

/* 瑞士地圖常數*/
export const SWITZERLAND_CONFIG = {
  CENTER: [46.8182, 8.2275],
  ZOOM: 8,
  BOUNDS: [
    [45.8, 5.9],  // 西南角
    [47.8, 10.5]  // 東北角
  ]
};

/* 台灣地圖常數*/
export const TAIWAN_CONFIG = {
  CENTER: [23.8, 120.9],
  ZOOM: 8,
  BOUNDS: [
    [21.9, 119.3],  // 西南角
    [25.3, 122.0]   // 東北角
  ]
};

/* 全球地圖常數*/
export const GLOBAL_CONFIG = {
  CENTER: [25.0, 121.0], // 預設台北
  ZOOM: 2,
  BOUNDS: null // 不限制邊界
};

/*交通方式顏色配置（與 transportModes.js 一致）*/
export const TRANSPORT_COLORS = {
  walk: 'green',        // 步行
  bicycle: 'blue',      // 腳踏車
  car: 'red',           // 汽車
  transit: 'purple',    // 大眾運輸
  default: '#6c757d'    // 預設灰色
};

/*地圖服務類*/
export class MapService {
  constructor() {
    this.map = null;
    this.markers = new Map();
    this.routeLines = new Map(); // 改為 Map 以支援多條路線
    this.routeGroups = new Map(); // 路線群組管理
  }

  /**
   * 初始化地圖
   * @param {HTMLElement} container - 地圖容器元素
   * @param {Object} options - 地圖選項
   * @param {string} region - 地區配置 ('taiwan', 'switzerland', 'global')
   */
  initMap(container, options = {}, region = 'global') {
    let config;
    switch (region) {
      case 'taiwan':
        config = TAIWAN_CONFIG;
        break;
      case 'switzerland':
        config = SWITZERLAND_CONFIG;
        break;
      default:
        config = GLOBAL_CONFIG;
        break;
    }

    const defaultOptions = {
      center: config.CENTER,
      zoom: config.ZOOM,
      zoomControl: true,
      attributionControl: true
    };

    const mapOptions = { ...defaultOptions, ...options };
    
    this.map = L.map(container, mapOptions);
    
    // 添加地圖圖層
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18
    }).addTo(this.map);
    
    // 設定地區邊界
    if (config.BOUNDS) {
      this.map.fitBounds(config.BOUNDS);
    }
    
    return this.map;
  }

  /**
   * 添加標記
   * @param {string} id - 標記 ID
   * @param {Array} coords - 座標 [lat, lng]
   * @param {Object} options - 標記選項
   */
  addMarker(id, coords, options = {}) {
    const defaultOptions = {
      title: '',
      popup: null,
      icon: null
    };

    const markerOptions = { ...defaultOptions, ...options };
    
    let marker;
    if (markerOptions.icon) {
      marker = L.marker(coords, { icon: markerOptions.icon });
    } else {
      marker = L.marker(coords);
    }

    if (markerOptions.title) {
      marker.bindTooltip(markerOptions.title);
    }

    if (markerOptions.popup) {
      marker.bindPopup(markerOptions.popup);
    }

    marker.addTo(this.map);
    this.markers.set(id, marker);
    
    return marker;
  }

  /**
   * 創建自訂圖標
   * @param {string} html - HTML 內容
   * @param {Array} size - 圖標大小 [width, height]
   */
  createCustomIcon(html, size = [30, 30]) {
    return L.divIcon({
      html: html,
      className: 'custom-marker',
      iconSize: size,
      iconAnchor: [size[0] / 2, size[1] / 2]
    });
  }

  /**
   * 移除標記
   * @param {string} id - 標記 ID
   */
  removeMarker(id) {
    const marker = this.markers.get(id);
    if (marker) {
      this.map.removeLayer(marker);
      this.markers.delete(id);
    }
  }

  /*清除所有標記*/
  clearMarkers() {
    this.markers.forEach(marker => this.map.removeLayer(marker));
    this.markers.clear();
  }

  /**
   * 繪製單條路線
   * @param {Array} coordinates - 座標點陣列 [[lat, lng], ...]
   * @param {Object} style - 路線樣式
   * @param {string} id - 路線 ID
   * @returns {Object} Leaflet polyline 物件
   */
  drawRoute(coordinates, style = {}, id = null) {
    const defaultStyle = {
      color: '#3388ff',
      weight: 4,
      opacity: 0.8
    };

    const routeStyle = { ...defaultStyle, ...style };
    const polyline = L.polyline(coordinates, routeStyle).addTo(this.map);
    
    if (id) {
      this.routeLines.set(id, polyline);
    } else {
      // 舊的 API 相容性
      this.routeLines.set(`route_${Date.now()}`, polyline);
    }
    
    return polyline;
  }

  /**
   * 繪製多條路線（四種交通方式）
   * @param {Object} routesData - 路線資料物件
   * @param {string} groupId - 路線群組 ID
   */
  drawMultipleRoutes(routesData, groupId = 'default') {
    // 清除舊的路線群組
    this.clearRouteGroup(groupId);
    
    const routeGroup = [];
    
    Object.entries(routesData).forEach(([transportKey, routeData]) => {
      if (routeData && routeData.plan && routeData.plan.itineraries) {
        const coordinates = this.extractRouteCoordinates(routeData);
        
        if (coordinates.length > 0) {
          const color = TRANSPORT_COLORS[transportKey] || TRANSPORT_COLORS.default;
          const routeId = `${groupId}_${transportKey}`;
          
          const polyline = this.drawRoute(coordinates, {
            color: color,
            weight: 4,
            opacity: 0.7,
            dashArray: transportKey === 'walk' ? '5, 5' : null
          }, routeId);
          
          // 添加路線資訊彈窗
          const duration = Math.round(routeData.plan.itineraries[0].duration / 60);
          const distance = (routeData.plan.itineraries[0].walkDistance / 1000).toFixed(1);
          
          polyline.bindPopup(`
            <strong>${this.getTransportName(transportKey)}</strong><br>
            時間: ${duration} 分鐘<br>
            距離: ${distance} 公里
          `);
          
          routeGroup.push(polyline);
        }
      }
    });
    
    this.routeGroups.set(groupId, routeGroup);
  }

  /**
   * 獲取交通方式中文名稱
   * @param {string} transportKey - 交通方式鍵值
   * @returns {string} 中文名稱
   */
  getTransportName(transportKey) {
    const names = {
      walk: '步行',
      bicycle: '腳踏車',
      car: '汽車',
      transit: '大眾運輸'
    };
    return names[transportKey] || transportKey;
  }

  /**
   * 切換路線顯示
   * @param {string} groupId - 路線群組 ID
   * @param {string} transportKey - 要顯示的交通方式
   */
  toggleRouteVisibility(groupId, transportKey) {
    const routeGroup = this.routeGroups.get(groupId);
    if (!routeGroup) return;

    // 隱藏所有路線
    Object.keys(TRANSPORT_COLORS).forEach(key => {
      if (key !== 'default') {
        const routeId = `${groupId}_${key}`;
        const route = this.routeLines.get(routeId);
        if (route) {
          route.setStyle({ opacity: 0.2, weight: 2 });
        }
      }
    });

    // 顯示選中的路線
    const activeRouteId = `${groupId}_${transportKey}`;
    const activeRoute = this.routeLines.get(activeRouteId);
    if (activeRoute) {
      activeRoute.setStyle({ opacity: 0.8, weight: 5 });
      activeRoute.bringToFront();
    }
  }

  /**
   * 清除路線群組
   * @param {string} groupId - 路線群組 ID
   */
  clearRouteGroup(groupId) {
    const routeGroup = this.routeGroups.get(groupId);
    if (routeGroup) {
      routeGroup.forEach(route => {
        this.map.removeLayer(route);
        // 從 routeLines 中移除
        this.routeLines.forEach((line, key) => {
          if (line === route) {
            this.routeLines.delete(key);
          }
        });
      });
      this.routeGroups.delete(groupId);
    }
  }

  /**
   * 清除所有路線
   */
  clearRoutes() {
    this.routeLines.forEach(line => this.map.removeLayer(line));
    this.routeLines.clear();
    this.routeGroups.clear();
  }

  /**
   * 移至指定位置
   * @param {Array} coords - 座標 [lat, lng]
   * @param {number} zoom - 縮放級別
   */
  flyTo(coords, zoom = 12) {
    this.map.flyTo(coords, zoom);
  }

  /**
   * 適應指定邊界
   * @param {Array} bounds - 邊界 [[lat, lng], [lat, lng]]
   * @param {Object} options - 選項
   */
  fitBounds(bounds, options = {}) {
    this.map.fitBounds(bounds, options);
  }

  /**
   * 適應瑞士邊界
   */
  fitToSwitzerland() {
    this.map.fitBounds(SWITZERLAND_CONFIG.BOUNDS);
  }

  /**
   * Google Polyline 解碼
   * @param {string} encoded - 編碼的 polyline 字串
   * @returns {Array} 座標點陣列
   */
  decodePolyline(encoded) {
    const points = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;
    
    while (index < len) {
      let b;
      let shift = 0;
      let result = 0;
      
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      
      const dlat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lat += dlat;
      
      shift = 0;
      result = 0;
      
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      
      const dlng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lng += dlng;
      
      points.push([lat / 1e5, lng / 1e5]);
    }
    
    return points;
  }

  /**
   * 從路線資料提取座標
   * @param {Object} routeData - OTP 路線資料
   * @returns {Array} 座標點陣列
   */
  extractRouteCoordinates(routeData) {
    const coordinates = [];
    
    if (routeData?.plan?.itineraries?.[0]?.legs) {
      routeData.plan.itineraries[0].legs.forEach(leg => {
        if (leg.legGeometry?.points) {
          // 檢查是否為簡化格式 (lat1,lon1;lat2,lon2)
          if (leg.legGeometry.points.includes(';')) {
            const points = leg.legGeometry.points.split(';');
            points.forEach(point => {
              const [lat, lon] = point.split(',').map(Number);
              if (!isNaN(lat) && !isNaN(lon)) {
                coordinates.push([lat, lon]);
              }
            });
          } else {
            // 標準 Google Polyline 格式
            const decoded = this.decodePolyline(leg.legGeometry.points);
            coordinates.push(...decoded);
          }
        } else if (leg.from && leg.to) {
          coordinates.push([leg.from.lat, leg.from.lon]);
          coordinates.push([leg.to.lat, leg.to.lon]);
        }
      });
    }
    
    return coordinates;
  }

}

// 創建預設實例
export const mapService = new MapService();