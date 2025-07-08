import React, { useState } from 'react';
import './attraction_card.css';

const AttractionCard = (props) => {
  return (
    <div className="attraction_card">
        <div className="vote_badge">{props.votes}</div>
        <div className="category_tag" style={{backgroundColor: props.color}}>{props.category}</div>
        <h2 className="attraction_name">{props.name}</h2>
    </div>
  );
};

export default AttractionCard;
