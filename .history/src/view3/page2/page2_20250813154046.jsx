import React, { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import AttractionContainer from '../../view2/chingchen/AttractionContainer.jsx';
import ScheduleContainer from '../../view2/chingchen/scheduleContainer.jsx';
import { CustomDragPreview } from '../../view2/chingchen/ScheduleInsert.jsx';
import Header from '../../components/header.jsx'

import './Page2.css';

const Page2 = () => {
            <div className="page2">
                <Header/>

                <div className="page2_content">

                    <AttractionContainer usedAttractions={usedAttractions} />
                    <ScheduleContainer
                        t_id={1}//@==@記得改掉@==@
                        usedAttractions={usedAttractions} 
                        onAttractionUsed={handleAttractionUsed} 
                    />
                </div>
            </div>

};

export default Page2;
