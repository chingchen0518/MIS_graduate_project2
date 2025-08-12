import React, { useImperativeHandle, useState, forwardRef, useEffect } from "react";
import { useDrag } from 'react-dnd';
import { Rnd } from "react-rnd";

// ScheduleItem 組件：顯示在行程時間軸上的單個景點項目
const ScheduleItem = ({ a_id,name, position, width, index, s_id, onMove, editable=false,height,onValueChange,onDragStop }) => {
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

    //function 2:當拖拽停止時
    const handleDragStop = (e, d) => {
        setX(d.x); // 更新 x 座標
        setY(d.y); // 更新 y 座標

        onValueChange(heightEdit, d.x, d.y,a_id);//回傳到ScheduleInsert

        onDragStop();//回到ScheduleInset做handleReorder
    };

    // if(editable) {
    //     useEffect(() => {
    //         onValueChange(heightEdit, x, y,a_id);
    //     }, [heightEdit, x, y, onValueChange]);
    // }


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
            disableDragging={!editable} // 如果不可編輯，則不允許拖拽
            default={{x: 100,y: 100,width: '100%',height: 35}}
            position={{ x: x, y: y }}//用state，因爲可能會更新
            size={{ width: 100, height: editable ? heightEdit : height }}
            enableResizing={{top: editable, bottom: editable, right: false,left: false,topRight: false,bottomRight: false,bottomLeft: false,topLeft: false,}}
            onResizeStop={handleResizeStop} //停止調整高度時
            onDragStop={handleDragStop} //停止drag時
            bounds="parent" // 限制在父容器內拖拽
            style={{
                backgroundColor: '#f0f0f0',
                border: '1px solid black',
                borderRadius: '5px',
                padding: '10px',
                boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
                opacity: isDragging ? 0.5 : 1,
                cursor: editable ? 'move' : 'default', // 根據 editable 切換游標樣式
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}

            //滑桿央視
            resizeHandleStyles={{
                top: handleStyle,
                bottom: handleStyle,
            }}

            key={`${a_id}`} // 使用 s_id 和 index 作為 key，確保唯一性
        >
            {/* 内容 */}
            <div
                className="attraction_name"
                style={{
                fontWeight: 'bold',
                color: '#333',
                fontSize: '14px', // 固定字體大小
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                width: '100%',
                textAlign: 'center'
                }}
            >
                {name}
            </div>
        </Rnd>

        // <div
        // ref={editable ? dragRef : null} // 如果不可拖拽，則不綁定 ref
        // className="schedule_item"
        // style={{
        //     position: 'absolute',
        //     left: ``,
        //     top: `${position.y}px`,
        //     width: '180px', // 調整寬度 - 您可以改成您想要的大小
        //     minWidth: '100px',
        //     maxWidth: '100px',
        //     height: editable ? `${heightEdit}px` : `${height}px` , // 調整高度 - 您可以改成您想要的大小
        //     backgroundColor: '#f0f0f0',
        //     border: '1px solid black',
        //     borderRadius: '5px',
        //     padding: '10px',
        //     boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
        //     opacity: isDragging ? 0.5 : 1,
        //     cursor: editable ? 'move' : 'default', // 根據 editable 切換游標樣式
            // boxSizing: 'border-box',
            // display: 'flex',
            // alignItems: 'center',
            // justifyContent: 'center'
        // }}
        // >
        // 
        // </div>
    );
};

export default ScheduleItem;
