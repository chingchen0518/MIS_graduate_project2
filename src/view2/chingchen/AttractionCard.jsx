import React, {useEffect } from "react";
import {useDrag } from "react-dnd";

import './AttractionCard.css';

const AttractionCard = ({ a_id,t_id, name,latitude,longitude, category, votes, color, isSelected, onClick, isUsed = false }) => {
  const [{ isDragging }, dragRef, dragPreview] = useDrag({
      type: "card",
    
      //要傳什麽過去
      item: { a_id:a_id,
              t_id:t_id,
              name:name,
              latitude:latitude,
              longitude:longitude
            }, 
    
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
