import React, { useState, useEffect } from "react";
import { DndProvider, useDrag } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import './attraction_card.css';

const AttractionCard = ({ a_id, name, category, votes, color, isSelected, onClick, isUsed = false }) => {
  const [{ isDragging }, dragRef, dragPreview] = useDrag({
      type: "card",
      item: { a_id:a_id}, // 使用資料庫的 a_id 作為拖拽數據的一部分
      canDrag: !isUsed, // 如果已被使用則不能拖動
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
      className={`attraction_card ${isSelected ? 'selected' : ''} ${isUsed ? 'used' : ''}`}
      onClick={onClick}
      style={{
        opacity: isUsed ? 0.5 : 1,
        cursor: isUsed ? 'not-allowed' : 'pointer'
      }}
    >
      <div className="vote_badge">{votes}</div>
      <div className="category_tag" style={{backgroundColor: color}}>{category}</div>
      <h2 className="attraction_name">{name}</h2>
    </div>
  );
};

export default AttractionCard;
