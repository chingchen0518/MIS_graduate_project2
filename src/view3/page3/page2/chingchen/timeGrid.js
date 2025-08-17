import { useContext } from 'react';
import { MyContext } from '..\..\..\src\App.jsx';

const timeColumn = ['00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00', 
                    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', 
                    '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '23:59'];

const { hourInterval, setHourInterval } = useContext(MyContext);

const timeGrid = (props) => {
    const lines = [];
    const intervalHeight = props.containerHeight / (timeColumn.length + 1); // 調整為空間÷25
    setHourInterval(intervalHeight);

    timeColumn.forEach((time, index) => {
        lines.push(
            <div
                key={`schedule-item-${props.s_id}-${index}`}
                style={{
                        position: 'absolute',
                        top: index * intervalHeight,
                        left: 0,
                        width: '100%',
                        height: '1px',
                        backgroundColor: 'lightgray',
                    }}
                />
            );
        });
    
}