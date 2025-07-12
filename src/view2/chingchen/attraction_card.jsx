import React from 'react';
import './attraction_card.css';

const AttractionCard = ({ name, category, votes, color, isSelected, onClick }) => {
  return (
    <div 
      className={`attraction_card ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className="vote_badge">{votes}</div>
      <div className="category_tag" style={{backgroundColor: color}}>{category}</div>
      <h2 className="attraction_name">{name}</h2>
    </div>
  );
};

export default AttractionCard;
