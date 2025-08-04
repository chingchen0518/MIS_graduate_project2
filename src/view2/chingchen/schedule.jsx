import React, { useState,useEffect, useRef, lazy, Suspense } from 'react';
import { useDrop, useDragLayer } from 'react-dnd';
import './schedule.css';
import AttractionCard from './attraction_card';
import ScheduleItem from './schedule_item.jsx'; // 引入 ScheduleItem 組件

const Schedule = ({ 
                    t_id,
                    s_id,
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
    const [scheduleItems, setScheduleItems] = useState([]);
    const [scheduleWidths, setScheduleWidths] = useState(0);

    const dropRef = useRef(null);
                  
    // 添加一个 useEffect 来计算和更新宽度
    useEffect(() => {
      const calculateWidth = () => {
        if (dropRef.current) {
          const scheduleTimeline = dropRef.current.querySelector('.schedule_timeline');
          if (scheduleTimeline) {
            const rect = scheduleTimeline.getBoundingClientRect();
            setScheduleWidths(rect.width);
            console.log('计算宽度:', rect.width);
            return rect.width; // 返回计算出的宽度值
          }
        }
        return 0; // 如果无法计算，返回默认值
      };
      
      calculateWidth(); // 初始计算宽度
      
      // 监听窗口大小变化，重新计算宽度
      window.addEventListener('resize', calculateWidth);
      
      // 清理函数
      return () => {
        window.removeEventListener('resize', calculateWidth);
      };
    }, []); // 空依赖数组表示只在组件挂载时执行


    useEffect(() => {
        // 從 API 獲取行程數據，如果有選擇日期則按日期過濾
        let api = `http://localhost:3001/api/view2_schedule_include_show/${t_id}/${s_id}`;
        console.log('🔍 按日期載入 Schedule:', t_id, s_id);
        fetch(api)
          .then(response => {
            if (!response.ok) {
              throw new Error('Network response was not ok');
            }
            return response.json();
          }).then(data => {
            setScheduleItems(data);
            console.log('API 返回数据:', data); // 检查 API 返回的数据结构
          })
          .catch(error => {
            console.error('Error fetching attractions:', error);
          });
    }, [t_id, s_id]);

  // function 1:確認行程按鈕處理函數
  const handleConfirm = async () => {
    if (isDraft && onScheduleConfirm) {
      // 如果是草稿狀態，確認整個行程
      await onScheduleConfirm(s_id, {
        ...scheduleData,
        attractions: attractions
      });
    } else {
      alert('此行程已經確認');
    }
  };

  // function 2:取消行程按鈕處理函數
  const handleCancel = () => {
    if (isDraft && onScheduleCancel) {
      if (confirm('確定要取消這個行程嗎？所有內容都會被刪除。')) {
        onScheduleCancel(s_id);
      }
    } else {
      alert('已確認的行程無法取消');
    }
  };

  const [{ isOver }, drop] = useDrop({
    accept: "card",
    drop: (item, monitor) => {
      if (!dropRef.current) {
        console.error("Drop target not found!");
        return;
      }

      // 使用 getClientOffset 獲取拖放預覽的位置，而不是原始元素的位置
      console.log("Monitor methods:", {
        getClientOffset: monitor.getClientOffset(),
        getSourceClientOffset: monitor.getSourceClientOffset(),
        getDifferenceFromInitialOffset: monitor.getDifferenceFromInitialOffset()
      });
      
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

      // 獲取鼠標相對於drop目標的位置（相對於schedule_timeline的左上角）
      // 將 x 坐標設為 0，讓元素總是從左邊開始
      const x = 0; // 固定為 0，總是從左邊開始
      const y = clientOffset.y - dropTargetRect.top;
      
      console.log('clientOffset:', clientOffset);
      console.log('dropTargetRect:', dropTargetRect);

      // 確保拖放位置不超出容器範圍
      // x 已經固定為 0，所以不需要修正
      const correctedX = x;
      const correctedY = Math.max(0, Math.min(y, dropTargetRect.height));

      console.log('Item dropped:', item, 'at position:', { x: correctedX, y: correctedY });
      // 可能有錯誤---------------------------------------------------------------------------------
      const dropTargetId = dropTarget.getAttribute('data-id'); // 獲取 Drop Target 的 ID
      // const s_id = dropTargetId || 1; // 使用 Drop Target 的 ID 作為 schedule ID，默認為 1
      
      // 可能有錯---------------------------------------------------------------------------------
      const a_id = item.a_id || 1; // 景點 ID，默認為 1
      const t_id = item.t_id || 1; // 使用 attraction_card 的 ID 作為 trip ID，默認為 1
      // const s_id

      //存入資料庫
      fetch('http://localhost:3001/api/view2_schedule_include_insert', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        //插入什麽進database
        body: JSON.stringify({a_id,t_id,s_id,x: correctedX,y: correctedY})
      }).then(data => {
        console.log('API response:', data);
      })
      .catch(error => {
        console.error('Error executing API:', error);
      });
      
// Hsiu Hui new ---------------------------------------
//       if (monitor.getItemType() === "card") {
//         // 只有在草稿狀態下才能添加新景點
//         if (!isDraft) {
//           console.log('⚠️ 已確認的行程無法添加新景點');
//           return;
//         }
        
//         // 處理從 attraction_card 拖動
//         const newAttraction = {
//           name: item.id,
//           time: null,
//           position: { x: correctedX, y: correctedY },
//           width: dropTargetRect.width,
//         };
        
//         setAttractions((prevAttractions) => [...prevAttractions, newAttraction]);
        
//         // 通知父組件該景點已被使用
//         if (onAttractionUsed) {
//           onAttractionUsed(item.id);
//         }
//       } else if (monitor.getItemType() === "schedule_item") {
//         // 處理 schedule_item 的重新排序（僅限同一個 schedule）
//         if (item.scheduleId === day) {
//           // 獲取拖動開始時鼠標相對於元素的偏移
//           const initialOffset = monitor.getInitialClientOffset();
//           const initialSourceOffset = monitor.getInitialSourceClientOffset();
//           const sourceOffset = monitor.getSourceClientOffset();
          
//           // 計算鼠標相對於被拖動元素的偏移量
//           let offsetX = 0;
//           let offsetY = 0;
//           if (initialOffset && initialSourceOffset) {
//             offsetX = initialOffset.x - initialSourceOffset.x;
//             offsetY = initialOffset.y - initialSourceOffset.y;
// Hsiu Hui new ---------------------------------------
          

      setAttractions((prevAttractions) => [
        ...prevAttractions,
        {
          name: item.name || item.id || '未命名景點', // 确保名称正确设置
          time: null,
          position: { x: correctedX, y: correctedY },
          width: dropTargetRect.width,
        },
      ]);
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
        {scheduleItems.map(scheduleItem => (
          console.log('Rendering schedule item:', scheduleItem),
          <ScheduleItem
            key={`schedule-item-${scheduleItem.id}`}
            s_id={scheduleItem.id}
            name={scheduleItem.name}
            position={{ x: scheduleItem.x, y: scheduleItem.y }}
            width={scheduleWidths}
          />
        ))}

        {attractions && attractions.length > 0 ? (
          <Suspense fallback={<div>Loading...</div>}>
            {attractions.map((attraction, index) => (
              // console.log('Rendering attraction:', attraction),
              <ScheduleItem
                key={`attraction-${index}`}
                name={attraction.name}
                position={attraction.position}
                width={attraction.width}

                index={index}
                s_id={s_id}
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
  const { item, currentOffset, isDragging } = useDragLayer((monitor) => ({
    item: monitor.getItem(),
    currentOffset: monitor.getClientOffset(),
    isDragging: monitor.isDragging(),
  }));

  const scheduleRef = document.querySelector('.schedule');
  const scheduleWidth = scheduleRef ? scheduleRef.offsetWidth : 0;

  if (!isDragging || !currentOffset || scheduleWidth === 0) {
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