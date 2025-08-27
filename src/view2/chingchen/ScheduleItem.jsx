import React, { useImperativeHandle, useState,useRef, forwardRef, useEffect } from "react";
import { useDrag,useDragLayer } from 'react-dnd';
import { Rnd } from "react-rnd";
import TransportTime from './TransportTime.jsx'; // 引入 TransportTime 組件

// ScheduleItem 組件：顯示在行程時間軸上的單個景點項目
const ScheduleItem = React.forwardRef(({ editmode=false,a_id,name, position, width, index, s_id, onMove, editable=false,height,onValueChange,onDragStop,intervalHeight,nextAId,getTransportMethod = () => {} ,transport_method, barRefs, scheduleItemRef, barCollide, categoryColor, category }, ref) => {
    // const user = JSON.parse(localStorage.getItem('user'));
    
    const [heightEdit, setheightEdit] = React.useState(height); // 初始高度
    const [x, setX] = React.useState(position.x); // 初始 X 座標
    const [y, setY] = React.useState(position.y); // 初始 Y 座標
    const nameRef = useRef();
    const [fontSize, setFontSize] = useState(16);

    //variables
    var draggingAId = null;
    
    //獲取目前拖拽中的物件的aId
    if(editmode){
        const { item: draggingItem, isDragging } = useDragLayer((monitor) => ({
            item: monitor.getItem(),
            isDragging: monitor.isDragging(),
        }));
    
        // 取得 a_id
        draggingAId = isDragging && draggingItem ? draggingItem.a_id : null;
        // 你可以把 draggingAId 傳給子組件或用於 UI
        console.log('目前拖拽的 a_id:', draggingAId);
    }

    //function 1:當調整高度停止時
    const handleResizeStop = (e, direction, ref, delta, position) => {
        setheightEdit(ref.offsetHeight);

        //如果向上調整高度，要更新y軸坐標
        if (["top"].includes(direction)) {
            setY(position.y); // 更新 y 座標
        }

        onValueChange(ref.offsetHeight, position.x, position.y,a_id);//回傳到ScheduleInsert
    };

    // function 2: 當拖拽停止時
    const handleDragStop = (e, d) => {
        setX(d.x); // 更新 x 座標
        setY(d.y); // 更新 y 座標
        console.log(d.y);
        onValueChange(heightEdit, d.x, d.y,a_id);//回傳到ScheduleInsert
    };

    // useEffect 1:調整字體大學小
    // useEffect(() => {
    // function resizeFont() {
    //     if (nameRef.current) {
    //         const parentWidth = nameRef.current.parentElement.offsetWidth;
    //         // 這裡根據寬度自訂縮放規則
    //         const newFontSize = Math.max(0, Math.min(16, parentWidth / 30));
    //         setFontSize(newFontSize);
    //     }
    //     }
    //     resizeFont();
    //     window.addEventListener('resize', resizeFont);
    //     return () => window.removeEventListener('resize', resizeFont);
    // }, []);
  
    const handleStyle = {
        height: '8px',
        width: '15%',
        marginLeft: '40%',
        // marginTop: '8px',

        border: '1px solid black',
        background: '#f0f0f0',
        borderRadius: '5px',
        cursor: 'ns-resize',
        zIndex: 4,
    };

    
    return (
        <Rnd
            minHeight={0}
            disableDragging={!editable}
            default={{ x: 100, y: 100, width: '100%', height: height }}
            position={{ x: x, y: y }}
            size={{ width: 100, height: editable ? heightEdit : height }}
            enableResizing={{ top: editable, bottom: editable, right: false, left: false, topRight: false, bottomRight: false, bottomLeft: false, topLeft: false }}
            onResizeStop={handleResizeStop}
            onDragStop={handleDragStop}
            bounds="parent"
            resizeHandleStyles={{
                top: handleStyle,
                bottom: handleStyle,
            }}
            key={`${a_id}`}
        >
            <div
                ref={scheduleItemRef}
                className="schedule_item"
                style={{
                    borderRadius: '8px',
                    padding: '3px', // 邊框厚度
                    boxShadow: '0 3px 8px rgba(0, 0, 0, 0.15)',
                    zIndex: 100,
                    // opacity: isDragging ? 0.5 : 1,
                    cursor: editable ? 'move' : 'default',
                    boxSizing: 'border-box',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    transition: 'all 0.3s ease',
                    // 漸層背景作為邊框
                    background: categoryColor ? categoryColor : 'linear-gradient(45deg, #d0d0d0, #d0d0d0)',
                }}
            >
                {/* 內容容器 */}
                <div
                    style={{
                        background: '#ffffff',
                        borderRadius: '5px',
                        padding: '7px',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                    }}
                >
                {/* 内容 */}
                <div
                    className="attraction_name"
                    style={{
                        fontWeight: 'bold',
                        color: '#333',
                        fontSize: fontSize, // 這行是重點
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        width: '100%',
                        textAlign: 'center',
                    }}
                >
                    {name}
                </div>
                </div>
            </div>

            {/* 交通時間 */}
            <TransportTime 
                intervalHeight={intervalHeight} 
                a_id={a_id}
                nextAId={nextAId ? nextAId : (draggingAId ? draggingAId : null)}
                editmode={editmode}
                transport_method={transport_method}
                getTransportMethod={getTransportMethod}
                barRefs={barRefs}
                barCollide={barCollide}
            />

        </Rnd>
    );
});

export default ScheduleItem;
