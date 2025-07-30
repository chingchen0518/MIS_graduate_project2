import React, { useState, useRef, lazy, Suspense } from 'react';
import { useDrop, useDragLayer } from 'react-dnd';
import './schedule.css';
import AttractionCard from './attraction_card';

// 使用 lazy 進行按需加載
const ScheduleItem = lazy(() => import('./schedule_item'));

const Schedule = ({ 
  title, 
  initialAttractions, 
  day, 
  scheduleId,
  scheduleData,
  isFirst, 
  isDraft = false,
  onAddSchedule, 
  containerHeight, 
  usedAttractions, 
  onAttractionUsed,
  onScheduleConfirm,
  onScheduleCancel
}) => {
  const [attractions, setAttractions] = useState(initialAttractions || []);
  const dropRef = useRef(null);

  // 確認行程按鈕處理函數
  const handleConfirm = async () => {
    if (isDraft && onScheduleConfirm) {
      // 如果是草稿狀態，確認整個行程
      await onScheduleConfirm(scheduleId, {
        ...scheduleData,
        attractions: attractions
      });
    } else {
      alert('此行程已經確認');
    }
  };

  // 取消行程按鈕處理函數
  const handleCancel = () => {
    if (isDraft && onScheduleCancel) {
      if (confirm('確定要取消這個行程嗎？所有內容都會被刪除。')) {
        onScheduleCancel(scheduleId);
      }
    } else {
      alert('已確認的行程無法取消');
    }
  };

  const [{ isOver }, drop] = useDrop({
    accept: ["card", "schedule_item"],
    drop: (item, monitor) => {
      if (!dropRef.current) {
        console.error("Drop target not found!");
        return;
      }

      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) {
        console.error("Client offset not found!");
        return;
      }

      const dropTarget = dropRef.current.querySelector('.schedule_timeline');
      if (!dropTarget) {
        console.error("Drop target element not found!");
        return;
      }

      const dropTargetRect = dropTarget.getBoundingClientRect();
      const x = 0;
      const y = clientOffset.y - dropTargetRect.top;
      const correctedX = x;
      const correctedY = Math.max(0, Math.min(y, dropTargetRect.height));

      if (monitor.getItemType() === "card") {
        // 只有在草稿狀態下才能添加新景點
        if (!isDraft) {
          console.log('⚠️ 已確認的行程無法添加新景點');
          return;
        }
        
        // 處理從 attraction_card 拖動
        const newAttraction = {
          name: item.id,
          time: null,
          position: { x: correctedX, y: correctedY },
          width: dropTargetRect.width,
        };
        
        setAttractions((prevAttractions) => [...prevAttractions, newAttraction]);
        
        // 通知父組件該景點已被使用
        if (onAttractionUsed) {
          onAttractionUsed(item.id);
        }
      } else if (monitor.getItemType() === "schedule_item") {
        // 處理 schedule_item 的重新排序（僅限同一個 schedule）
        if (item.scheduleId === day) {
          // 獲取拖動開始時鼠標相對於元素的偏移
          const initialOffset = monitor.getInitialClientOffset();
          const initialSourceOffset = monitor.getInitialSourceClientOffset();
          const sourceOffset = monitor.getSourceClientOffset();
          
          // 計算鼠標相對於被拖動元素的偏移量
          let offsetX = 0;
          let offsetY = 0;
          if (initialOffset && initialSourceOffset) {
            offsetX = initialOffset.x - initialSourceOffset.x;
            offsetY = initialOffset.y - initialSourceOffset.y;
          }
          
          // 調整落點位置，減去鼠標偏移
          const adjustedY = correctedY - offsetY;
          const finalY = Math.max(0, Math.min(adjustedY, dropTargetRect.height));
          
          setAttractions((prevAttractions) => {
            const newAttractions = [...prevAttractions];
            const draggedItem = newAttractions[item.index];
            if (draggedItem) {
              draggedItem.position = { x: correctedX, y: finalY };
            }
            return newAttractions;
          });
        }
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  drop(dropRef);

  const renderGrid = () => {
    const timeColumn = ['00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00',
                        '08:00', '09:00', '10:00', '11:00', '12:00','13:00', '14:00', '15:00', 
                       '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00','23:59'
                     ];
    const lines = [];
    const intervalHeight = containerHeight / 25; // 調整為空間/25

    timeColumn.forEach((time, index) => {
      lines.push(
        <div key={index} style={{ position: "absolute", top: index * intervalHeight, left: 0, width: "100%", height: "1px", backgroundColor: "lightgray" }} />
      );
    });

    return lines;
  };

  if (isFirst) {
    return (
      <div className="schedule add_schedule_column" style={{ height: containerHeight }}>
        <div className="add_schedule_content">
          <div className="add_schedule_icon" onClick={onAddSchedule}>
            <div className="plus_icon">+</div>
          </div>
          <div className="add_schedule_text">新增行程</div>
          <button className="skip_btn">跳過</button>
        </div>
      </div>
    );
  }

  return (
    <div ref={dropRef} className={`schedule ${isOver ? 'highlight' : ''}`} style={{ position: 'relative', height: containerHeight, overflow: 'hidden', maxHeight: containerHeight, overflowY: 'hidden', overflowX: 'hidden' }}>
      <div className="schedule_header">
        <div className="user_avatar">
          <img src="https://www.iconpacks.net/icons/2/free-user-icon-3296-thumb.png" alt="User" />
        </div>
        <div className="budget_display">$350</div>
        {isDraft && (
          <>
            <button className="confirm_btn" onClick={handleConfirm}>確認</button>
            <button className="cancel_btn" onClick={handleCancel}>取消</button>
          </>
        )}
        <span className="schedule_date">{title}</span>
      </div>
      
      <div className="schedule_timeline" style={{ position: 'relative', overflow: 'hidden', maxHeight: containerHeight }}>
        {renderGrid()}
        
        {/* 顯示景點 */}
        {attractions && attractions.length > 0 ? (
          <Suspense fallback={<div>Loading...</div>}>
            {attractions.map((attraction, index) => (
              <ScheduleItem
                key={`attraction-${index}`}
                name={attraction.name}
                position={attraction.position}
                width={attraction.width}
                index={index}
                scheduleId={scheduleId}
                isDraft={isDraft}
              />
            ))}
          </Suspense>
        ) : (
          <div className="schedule_empty">
            <span>{isDraft ? '拖拽景點到這裡' : '暫無行程安排'}</span>
          </div>
        )}
      </div>
    </div>
  );
};

const CustomDragPreview = () => {
  const { item, currentOffset, isDragging, itemType } = useDragLayer((monitor) => ({
    item: monitor.getItem(),
    currentOffset: monitor.getClientOffset(),
    isDragging: monitor.isDragging(),
    itemType: monitor.getItemType(),
  }));

  const scheduleRef = document.querySelector('.schedule');
  const scheduleWidth = scheduleRef ? scheduleRef.offsetWidth : 0;

  // 只對 "card" 類型顯示自定義預覽，不對 "schedule_item" 顯示
  if (!isDragging || !currentOffset || scheduleWidth === 0 || itemType === "schedule_item") {
    return null;
  }

  // 移除預覽的水平偏移
  const x = currentOffset.x - (scheduleWidth / 2);
  const y = currentOffset.y;

  return (
    <div
      style={{
        position: 'fixed',
        pointerEvents: 'none',
        transform: `translate(${x}px, ${y}px)`,
        // left: `${x - scheduleWidth * 0.45}px`, // 調整 x 坐標，讓鼠標位於預覽圖中心
        // top: `${y - 50}px`, // 調整 y 坐標，讓鼠標位於預覽圖中心
        width: `${scheduleWidth * 0.9}px`, // 基於 schedule 的寬度
        backgroundColor: '#f0f0f0',
        border: '1px solid black',
        borderRadius: '5px',
        padding: '10px',
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
        zIndex: 100,
      }}
    >
      <div className="attraction_name" style={{ fontWeight: 'bold', color: '#333' }}>
        {item?.id}
      </div>
    </div>
  );
};

export default Schedule;

export { CustomDragPreview };