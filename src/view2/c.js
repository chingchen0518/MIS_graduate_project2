import React, { useState } from 'react';
import './c.css';

const AttractionList = () => {
  const [selectedAttraction, setSelectedAttraction] = useState(null);
  const [attractions] = useState([
    {
      id: 1,
      name: '十鼓文化村',
      category: '文化',
      votes: 15,
      color: '#4A90E2'
    },
    {
      id: 2,
      name: '嘉義宮輪館',
      category: '文化',
      votes: 12,
      color: '#4A90E2'
    },
    {
      id: 3,
      name: '台北101',
      category: '地標',
      votes: 25,
      color: '#5CB85C'
    },
    {
      id: 4,
      name: '九份老街',
      category: '老街',
      votes: 18,
      color: '#9C27B0'
    },
    {
      id: 5,
      name: '淡水漁人碼頭',
      category: '景觀',
      votes: 20,
      color: '#FF9800'
    },
    {
      id: 6,
      name: '故宮博物院',
      category: '博物館',
      votes: 22,
      color: '#2196F3'
    },
    {
      id: 7,
      name: '陽明山',
      category: '自然',
      votes: 16,
      color: '#4CAF50'
    },
    {
      id: 8,
      name: '士林夜市',
      category: '美食',
      votes: 30,
      color: '#E91E63'
    },
    {
      id: 9,
      name: '日月潭',
      category: '自然',
      votes: 28,
      color: '#4CAF50'
    },
    {
      id: 10,
      name: '墾丁國家公園',
      category: '自然',
      votes: 24,
      color: '#4CAF50'
    }
  ]);

  const handleSelectAttraction = (attraction) => {
    setSelectedAttraction(attraction);
  };

  return (
    <div className="attraction-container">
      <div className="attraction-sidebar">
        <h2 className="sidebar-title">景點清單</h2>
        <div className="attraction-list">
          {attractions.map(attraction => (
            <div 
              key={attraction.id} 
              className={`attraction-item ${selectedAttraction?.id === attraction.id ? 'selected' : ''}`}
              onClick={() => handleSelectAttraction(attraction)}
            >
              <h3 className="attraction-name">{attraction.name}</h3>
              <div className="attraction-info">
                <span 
                  className="category-tag"
                  style={{ backgroundColor: attraction.color }}
                >
                  {attraction.category}
                </span>
                <div className="votes">
                  <span className="fire-icon">🔥</span>
                  <span className="vote-count">{attraction.votes}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="attraction-content">
        {selectedAttraction ? (
          <div className="selected-attraction-detail">
            <h1>{selectedAttraction.name}</h1>
            <p className="category-info">
              分類: <span 
                className="category-tag large"
                style={{ backgroundColor: selectedAttraction.color }}
              >
                {selectedAttraction.category}
              </span>
            </p>
            <p className="vote-info">
              <span className="fire-icon">🔥</span>
              票數: {selectedAttraction.votes}
            </p>
            <p className="description">
              點擊左側景點清單可以查看不同景點的詳細資訊
            </p>
          </div>
        ) : (
          <div className="no-selection">
            <h2>請選擇一個景點</h2>
            <p>點擊左側景點清單來查看詳細資訊</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttractionList;