import React, { useImperativeHandle, useState, forwardRef, useEffect } from "react";
import { useDrag } from 'react-dnd';
import { Rnd } from "react-rnd";
import TransportTime from './TransportTime.jsx'; // 引入 TransportTime 組件

// ScheduleItem 組件：顯示在行程時間軸上的單個景點項目
const ScheduleItem = ({ editmode=false,a_id,name, position, width, index, s_id, onMove, editable=false,height,onValueChange,onDragStop,intervalHeight,nextAId,filterConditions }) => {
    if(editmode){
        console.log("name:", name,"aId:", a_id,"nextAid",nextAId);
    }
    const [heightEdit, setheightEdit] = React.useState(35); // 初始高度
    const [x, setX] = React.useState(position.x); // 初始 X 座標
    const [y, setY] = React.useState(position.y); // 初始 Y 座標

    const [{ isDragging }, dragRef] = useDrag({
        type: "schedule_item",
        item: { 
        name, 
        index, 
        s_id,
        originalPosition: position 
        },
        canDrag: editable, // 根據 editable 決定是否可以拖拽
        collect: (monitor) => ({
        isDragging: monitor.isDragging(),
        }),
    });
  

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

    const handleStyle = {
        height: '8px',
        width: '20%',
        marginLeft: '40%',

        border: '1px solid black',
        background: '#f0f0f0',
        borderRadius: '5px',
        cursor: 'ns-resize',
    };

    // 判斷是否應該顯示星星（景點被選中時）
    const shouldShowStar = () => {
        if (!filterConditions || !filterConditions.selectedAttractions) return false;
        return filterConditions.selectedAttractions.includes(a_id);
    };

    return (
        <Rnd
            disableDragging={!editable}
            default={{ x: 100, y: 100, width: '100%', height: 35 }}
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
                className="schedule_item"
                style={{
                    backgroundColor: '#f0f0f0',
                    border: '1px solid black',
                    borderRadius: '5px',
                    padding: '10px',
                    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
                    opacity: isDragging ? 0.5 : 1,
                    cursor: editable ? 'move' : 'default',
                    boxSizing: 'border-box',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                }}
            >
                {/* 内容 */}
                <div
                    className="attraction_name"
                    style={{
                        fontWeight: 'bold',
                        color: '#333',
                        fontSize: '14px',
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

            {/* 交通時間 */}
            <TransportTime 
                intervalHeight={intervalHeight} 
                a_id={a_id}
                nextAId={nextAId}
                editmode={editmode}
            />

        </Rnd>
    );
};

export default ScheduleItem;
