// components/TravelPlanner/InteractiveMap.jsx
import React, { memo } from 'react';
import { useGoogleMap } from '../../../hooks/useGoogleMap.jsx';

const InteractiveMap = memo(() => {
  const { mapRef, googleMapsLoaded, mapError, selectedAttraction } = useGoogleMap();

  return (
    <div style={{
      width: '35%',
      backgroundColor: 'white',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      flexDirection: 'column',
      borderRadius: '8px',
      overflow: 'hidden'
    }}>

      <div style={{
        flex: 1,
        position: 'relative',
        minHeight: '400px'
      }}>
        <div
          ref={mapRef}
          style={{
            width: '100%',
            height: '100%',
            minHeight: '400px'
          }}
        />
        {(!googleMapsLoaded || mapError) && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: '#666',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              fontSize: '2rem',
              marginBottom: '0.5rem'
            }}>🗺️</div>
            <div style={{
              color: mapError ? '#ef4444' : '#666'
            }}>
              {mapError || '地圖載入中...'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

InteractiveMap.displayName = 'InteractiveMap';

export default InteractiveMap;