import React from 'react';
import './attraction_card.css';

const AttractionCard = ({ name, category, votes, color, isSelected, onClick, isDragged, onDragStart, onDragEnd }) => {
  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ name, category, votes, color }));
    if (onDragStart) {
      onDragStart();
    }
  };

  const handleDragEnd = (e) => {
    if (onDragEnd) {
      onDragEnd();
    }
  };

  return (
    <div 
      className={`attraction_card ${isSelected ? 'selected' : ''} ${isDragged ? 'dragged' : ''}`}
      onClick={onClick}
      draggable={true}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="vote_badge">{votes}</div>
      <div className="category_tag" style={{backgroundColor: color}}>{category}</div>
      <h2 className="attraction_name">{name}</h2>
    </div>
  );
};

export default AttractionCard;
