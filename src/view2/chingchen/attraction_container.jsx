import React, { useState } from 'react';
import AttractionCard from './attraction_card.jsx';
import AttractionDetails from './attraction_details.jsx';

import './attraction_container.css';

const Attraction_container = () => {
  const [selectedTab, setSelectedTab] = useState('選擇文化村');
  const [selectedAttraction, setSelectedAttraction] = useState(null);
  const [attractions, setAttractions] = useState([
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

  const handleCardClick = (attraction) => {
    setSelectedAttraction(attraction);
  };

  return (
      <div className="attraction_container">
        <div className="attraction_cards_wrapper">
          {attractions.map(attraction => (
            <AttractionCard 
              key={attraction.id}
              name={attraction.name}
              category={attraction.category}
              votes={attraction.votes}
              color={attraction.color}
              isSelected={selectedAttraction?.id === attraction.id}
              onClick={() => handleCardClick(attraction)}
            />
          ))}
        </div>
        <AttractionDetails attraction={selectedAttraction} />
      </div>
  );
};

export default Attraction_container;