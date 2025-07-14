import React, { useState, useEffect } from "react";
import { DndProvider, useDrag } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import './attraction_card.css';

const AttractionCard = ({ name, category, votes, color, isSelected, onClick }) => {
  const [{ isDragging }, dragRef, dragPreview] = useDrag({
      type: "card",
      item: { id: name },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    });

  useEffect(() => {
    // Hide the default drag preview
    const emptyImage = new Image();
    emptyImage.src = "";
    dragPreview(emptyImage);
  }, [dragPreview]);

  return (
    <div 
      ref={dragRef}
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
