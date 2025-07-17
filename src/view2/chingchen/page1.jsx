import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Attraction_container from '../chingchen/attraction_container.jsx';
import Schedule_container from '../chingchen/schedule_container.jsx';
import { CustomDragPreview } from './schedule.jsx';
import Header from '../../components/header.jsx'

import './page1.css';

const Page1 = () => {
  return (
    <DndProvider backend={HTML5Backend}>
      <CustomDragPreview />
      <div className="page1">
        <Header />
        <div className="page1_content">
          <Attraction_container />
          <Schedule_container />
        </div>
      </div>
    </DndProvider>
  );
};

export default Page1;
