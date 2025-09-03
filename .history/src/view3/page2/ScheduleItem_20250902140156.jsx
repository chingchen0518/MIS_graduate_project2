import React, { useImperativeHandle, useState, forwardRef, useEffect } from "react";
import { useDrag } from 'react-dnd';
import { Rnd } from "react-rnd";
import TransportTime from './TransportTime.jsx'; // 引入 TransportTime 組件
import './ScheduleItem.css'; // 引入樣式文件

// ScheduleItem 組件：顯示在行程時間軸上的單個景點項目
const ScheduleItem = ({ editmode = false, a_id, name, position, width, index, s_id, onMove, editable = false, height, onValueChange, onDragStop, intervalHeight, nextAId, isSelected = false, categoryColor, category, isAnimating = false }) => {
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

        onValueChange(ref.offsetHeight, position.x, position.y, a_id);//回傳到ScheduleInsert
    };

    // function 2: 當拖拽停止時
    const handleDragStop = (e, d) => {
        setX(d.x); // 更新 x 座標
        setY(d.y); // 更新 y 座標
        onValueChange(heightEdit, d.x, d.y, a_id);//回傳到ScheduleInsert
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
                    borderRadius: '8px',
                    padding: '3px', // 邊框厚度
                    boxShadow: '0 3px 8px rgba(0, 0, 0, 0.15)',
                    opacity: isDragging ? 0.5 : 1,
                    cursor: editable ? 'move' : 'default',
                    boxSizing: 'border-box',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    position: 'relative',
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
                    {/* 愛心標記 - 當景點被選中時顯示 */}
                    {isSelected && (
                        <div className="heart-marker">
                            😍
                        </div>
                    )}

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
            </div>

            {/* 交通時間 */}
            <TransportTime
                intervalHeight={intervalHeight}
                a_id={a_id}
                nextAId={nextAId}
                editmode={editmode}
                transport_method={null}
                getTransportMethod={() => { }}
                barRefs={null}
                barCollide={[false, false, false, false]}
                maxBarHeight={100}
            />

        </Rnd>
    );
};

export default ScheduleItem;
