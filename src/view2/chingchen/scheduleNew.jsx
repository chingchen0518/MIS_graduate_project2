import React, {lazy} from 'react';
import './schedule.css';

// 使用 lazy 進行按需加載
const ScheduleItem = lazy(() => import('./ScheduleItem'));


const ScheduleNew = ({
    containerHeight,
    onAddNewSchedule,
    isBlinking = false
}) => {
    return (
        <div className="schedule scheduleNew add_schedule_column" style={{ height: containerHeight }}>
            <div className="add_schedule_content">
                <div className={`add_schedule_icon${isBlinking ? ' blinking' : ''}`} onClick={() => onAddNewSchedule(true)}>
                    <svg className="plus_icon" viewBox="0 0 24 24">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                </div>
                <div className="add_schedule_text">新增行程</div>
                <button className="skip_btn">跳過</button>
            </div>
        </div>
    );
};

export default ScheduleNew;
