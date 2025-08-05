//不可編輯的schedule
import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useDrop, useDragLayer } from 'react-dnd';
import './schedule.css';
import AttractionCard from './attraction_card';
import ScheduleItem from './schedule_item.jsx'; // 引入 ScheduleItem 組件

const Schedule = (props) => {
    var editable = 1;

    // state
    const [attractions, setAttractions] = useState(props.initialAttractions || []); //景點
    const [scheduleItems, setScheduleItems] = useState([]);
    const [scheduleWidths, setScheduleWidths] = useState(0);

    //創建一個 React Ref物件
    const dropRef = useRef(null);
    
    // useEffect 1：計算schedule_item需要的寬度
    useEffect(() => {
        const calculateWidth = () => {
            if (dropRef.current) {
                const scheduleTimeline = dropRef.current.querySelector('.schedule_timeline');
                if (scheduleTimeline) {
                    const rect = scheduleTimeline.getBoundingClientRect(); //取得寬度
                    setScheduleWidths(rect.width); //更新到 state
                    return rect.width; // 返回计算出的宽度值
                }
            }else{ return 0; } // 如果无法计算，返回默认值  
        };

        calculateWidth(); // 初始计算宽度

        // 监听窗口大小变化，重新计算宽度
        window.addEventListener('resize', calculateWidth);

        // 清理函数
        return () => {
            window.removeEventListener('resize', calculateWidth);
        };
    }, []); // 空依赖数组表示只在组件挂载时执行

    // Use Effect 2:從DB讀取別人的行程的schedule_item，按日期過濾
    useEffect(() => {
        let api = `http://localhost:3001/api/view2_schedule_include_show/${props.t_id}/${props.s_id}`;

        console.log('🔍 按日期載入 Schedule:', props.t_id, props.s_id);

        fetch(api)
        .then((response) => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then((data) => {
            setScheduleItems(data);
            console.log('API 返回数据:', data); // 检查 API 返回的数据结构
        })
        .catch((error) => {
            console.error('Error fetching attractions:', error);
        });
    }, [props.t_id, props.s_id]);

    // const handleConfirm = async () => {
    //     if (props.isDraft && props.onScheduleConfirm) {
    //         // 如果是草稿狀態，確認整個行程
    //         await props.onScheduleConfirm(props.s_id, {
    //             ...props.scheduleData,
    //             attractions: attractions,
    //         });
    //     } else {
    //         alert('此行程已經確認');
    //     }
    // };

    // const handleCancel = () => {
    //     if (props.isDraft && props.onScheduleCancel) {
    //         if (confirm('確定要取消這個行程嗎？所有內容都會被刪除。')) {
    //             props.onScheduleCancel(props.s_id);
    //         }
    //     } else {
    //         alert('已確認的行程無法取消');
    //     }
    // };

  const [{ isOver }, drop] = useDrop({
      accept: 'card',
      drop: (item, monitor) => {
          if (!dropRef.current) {
              console.error('Drop target not found!');
              return;
          }

          const clientOffset = monitor.getClientOffset();
          if (!clientOffset) {
              console.error('Client offset not found!');
              return;
          }

          const dropTarget = dropRef.current.querySelector('.schedule_timeline');
          if (!dropTarget) {
              console.error('Drop target element not found!');
              return;
          }

          const dropTargetRect = dropTarget.getBoundingClientRect();

          const x = 0; // 固定為 0，總是從左邊開始
          const y = clientOffset.y - dropTargetRect.top;

          const correctedX = x;
          const correctedY = Math.max(0, Math.min(y, dropTargetRect.height));

          const a_id = item.a_id || 1; // 景點 ID，默認為 1
          const t_id = item.t_id || 1; // 使用 attraction_card 的 ID 作為 trip ID，默認為 1

          fetch('http://localhost:3001/api/view2_schedule_include_insert', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ a_id, t_id, s_id: props.s_id, x: correctedX, y: correctedY }),
          })
              .then((data) => {
                  console.log('API response:', data);
              })
              .catch((error) => {
                  console.error('Error executing API:', error);
              });

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
      const timeColumn = ['00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '23:59'];
      const lines = [];
      const intervalHeight = props.containerHeight / 25; // 調整為空間/25

      timeColumn.forEach((time, index) => {
          lines.push(
              <div
                  key={index}
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

      return lines;
  };

  if (props.isFirst) {
      return (
          <div className="schedule add_schedule_column" style={{ height: props.containerHeight }}>
              <div className="add_schedule_content">
                  <div className="add_schedule_icon" onClick={props.onAddSchedule}>
                      <div className="plus_icon">+</div>
                  </div>
                  <div className="add_schedule_text">新增行程</div>
                  <button className="skip_btn">跳過</button>
              </div>
          </div>
      );
  }

  return (
        <div
            ref={dropRef}
            className={`schedule ${isOver ? 'highlight' : ''}`}
            style={{
                position: 'relative',
                height: props.containerHeight,
                overflow: 'hidden',
                maxHeight: props.containerHeight,
                overflowY: 'hidden',
                overflowX: 'hidden',
            }}
        >
          <div className="schedule_header">
              <div className="user_avatar">
                  <img
                      src="https://www.iconpacks.net/icons/2/free-user-icon-3296-thumb.png"
                      alt="User"
                  />
              </div>
              <div className="budget_display">$350</div>
              {/* 確認按鍵 */}
              {/* {props.isDraft && (
                  <>
                      <button className="confirm_btn" onClick={handleConfirm}>
                          確認
                      </button>
                      <button className="cancel_btn" onClick={handleCancel}>
                          取消
                      </button>
                  </>
              )} */}

              <span className="schedule_date">{props.title}</span>
          </div>

          <div
              className="schedule_timeline"
              style={{ position: 'relative', overflow: 'hidden', maxHeight: props.containerHeight }}
          >
              {renderGrid()}

              {/* 顯示景點（已經在資料庫的） */}
              {scheduleItems.map((scheduleItem) => (
                    <ScheduleItem {...ScheduleItemProps}
                        key={`schedule-item-${scheduleItem.id}`}
                        s_id={scheduleItem.id}
                        name={scheduleItem.name}
                        position={{ x: scheduleItem.x, y: scheduleItem.y }} // x和y的位置，傳入object
                        width={scheduleWidths} // 使用計算出的寬度

                    />
              ))}

              {attractions && attractions.length > 0 ? (
                  <Suspense fallback={<div>Loading...</div>}>
                      {attractions.map((attraction, index) => (
                          <ScheduleItem
                              key={`attraction-${index}`}
                              name={attraction.name}
                              position={attraction.position}
                              width={attraction.width}
                              index={index}
                              s_id={props.s_id}
                              isDraft={props.isDraft}
                          />
                      ))}
                  </Suspense>
              ) : (
                  <div className="schedule_empty">
                      <span>{props.isDraft ? '拖拽景點到這裡' : '暫無行程安排'}</span>
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

  const x = currentOffset.x - scheduleWidth / 2;
  const y = currentOffset.y;

  return (
      <div
          style={{
              position: 'fixed',
              pointerEvents: 'none',
              transform: `translate(${x}px, ${y}px)`,
              width: `${scheduleWidth * 0.9}px`,
              backgroundColor: '#f0f0f0',
              border: '1px solid black',
              borderRadius: '5px',
              padding: '10px',
              boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
              zIndex: 100,
          }}
      >
          <div
              className="attraction_name"
              style={{ fontWeight: 'bold', color: '#333' }}
          >
              {item?.id}
          </div>
      </div>
  );
};

export default Schedule;

export { CustomDragPreview };