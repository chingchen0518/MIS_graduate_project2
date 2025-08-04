import React, { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Attraction_container from '../chingchen/attraction_container.jsx';
import Schedule_container from '../chingchen/schedule_container.jsx';
import { CustomDragPreview } from './schedule.jsx';
import Header from '../../components/header.jsx'
import MapDisplay from '../Liu/mapAddRoute/MapDisplay.jsx'

import './page1.css';

const Page1 = () => {
  const [usedAttractions, setUsedAttractions] = useState([]);

  const handleAttractionUsed = (attractionName) => {
    if (!usedAttractions.includes(attractionName)) {
      setUsedAttractions(prev => [...prev, attractionName]);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <CustomDragPreview />
      <div className="page1">
        <Header />
        <div className="page1_content">
          <Attraction_container usedAttractions={usedAttractions} />
          <Schedule_container
            t_id={1}//記得換
            usedAttractions={usedAttractions} 
            onAttractionUsed={handleAttractionUsed} 
          />
        </div>
      </div>
    </DndProvider>
  );
};

export default Page1;
