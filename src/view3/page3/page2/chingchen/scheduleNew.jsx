import React, {lazy} from 'react';
import './schedule.css';

// 使用 lazy 進行按需加載
const ScheduleItem = lazy(() => import('./ScheduleItem'));


const ScheduleNew = ({
    containerHeight,
    onAddNewSchedule
}) => {

    return (
        <div className="schedule scheduleNew add_schedule_column" style={{ height: containerHeight }}>
            <div className="add_schedule_content">
                <div className="add_schedule_icon" onClick={() => onAddNewSchedule(true)}>
                    <div className="plus_icon">+</div>
                </div>
                <div className="add_schedule_text">新增行程</div>
                <button className="skip_btn">跳過</button>
            </div>
        </div>
    );
};

export default ScheduleNew;
