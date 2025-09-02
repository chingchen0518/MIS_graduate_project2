// src/hooks/useGoogleMap.jsx
import { useEffect, useRef, useState } from 'react';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyCnjtXA8sjbXuj2Mbb5oDdmlfXgw_IpdRY';

export const useGoogleMap = (isVisible = true) => {
  const mapRef = useRef(null);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [map, setMap] = useState(null);
  const [selectedAttraction, setSelectedAttraction] = useState(null);

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'AIzaSyCnjtXA8sjbXuj2Mbb5oDdmlfXgw_IpdRY') {
    }
  }, []);

  // 載入 Google Maps API
  useEffect(() => {
    if (window.google && window.google.maps) {
      setGoogleMapsLoaded(true);
      return;
    }

    // 檢查是否已經有 script 標籤
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      // 如果有，等它載入
      existingScript.onload = () => {
        setGoogleMapsLoaded(true);
        setMapError(null);
      };
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=geometry,places`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      setGoogleMapsLoaded(true);
      setMapError(null);
    };
    
    script.onerror = (error) => {
      setMapError('Google Maps API 載入失敗');
    };
    
    document.head.appendChild(script);

    return () => {
      // 清理函數 - 不要移除 script，因為可能有其他組件在使用
    };
  }, []);

  // 地圖初始化
  useEffect(() => {
    if (!googleMapsLoaded || !mapRef.current || !isVisible || map) {
      return;
    }

    try {
      const taiwanCenter = { lat: 24.0, lng: 121.0 };
      
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        zoom: 7,
        center: taiwanCenter,
        mapTypeId: 'roadmap',
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      setMap(mapInstance);

    } catch (error) {
      setMapError('地圖初始化失敗');
    }
  }, [googleMapsLoaded, isVisible, map]);

  return {
    mapRef,
    googleMapsLoaded,
    mapError,
    selectedAttraction,
    map
  };
};

export default useGoogleMap;