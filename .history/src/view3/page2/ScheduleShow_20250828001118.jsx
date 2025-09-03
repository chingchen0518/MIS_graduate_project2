//不可編輯的schedule
import React, { useState, useEffect, useRef } from 'react';
import './schedule.css';
import ScheduleItem from './ScheduleItem.jsx'; // 引入 ScheduleItem 組件

const ScheduleShow = (props) => {
    // state
    const [attractions, setAttractions] = useState(props.initialAttractions || []); //景點
    const [scheduleItems, setScheduleItems] = useState([]);
    // 拖曳排序用
    const [draggedId, setDraggedId] = useState(null);
    const [order, setOrder] = useState([]); // scheduleItem id 排序
    // 線條交互
    const [hoveredLine, setHoveredLine] = useState(null);
    const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, detail: '' });
    const [scheduleWidths, setScheduleWidths] = useState(0);
    const [totalBudget, setTotalBudget] = useState(0); // 新增：總預算
    const [voteData, setVoteData] = useState({ total_likes: 0, total_dislikes: 0 }); // 新增：投票數據
    const [currentUserVote, setCurrentUserVote] = useState(null); // 新增：當前用戶的投票狀態

    // 從props獲取篩選條件
    const { costRange = [0, 1000], selectedAttractions = [], selectedUsers = [] } = props.filterConditions || {};

    // 檢查預算是否在篩選範圍內
    const isBudgetInRange = totalBudget >= costRange[0] && totalBudget <= costRange[1];

    // 檢查使用者是否被選中（相反邏輯：選中的使用者會變透明，沒選中的使用者正常顯示）
    const isUserSelected = selectedUsers.length === 0 || !selectedUsers.includes(props.u_id);

    // 計算透明度 - 若預算不在範圍內或使用者被選中（排除），則變透明
    const getScheduleOpacity = () => {
        if (!isBudgetInRange || !isUserSelected) return 0.3;
        return 1;
    };

    // 格式化日期，只保留YYYY-MM-DD部分
    const formatDate = (dateString) => {
        if (!dateString) return '';

        // 如果已經是 YYYY-MM-DD 格式，直接返回
        if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            return dateString;
        }

        // 否則轉換為 YYYY-MM-DD 格式
        const date = new Date(dateString);
        return date.toISOString().split('T')[0]; // 只取日期部分
    };

    // 添加調試信息
    useEffect(() => {
        console.log('ScheduleShow props:', {
            t_id: props.t_id,
            s_id: props.s_id,
            title: props.title,
            originalDate: props.date,
            formattedDate: formatDate(props.date)
        });
    }, [props.t_id, props.s_id, props.date]);

    // useEffect 1：計算schedule_item需要的寬度
    useEffect(() => {
        const calculateWidth = () => {
            const scheduleTimeline = document.querySelector('.schedule_timeline');
            if (scheduleTimeline) {
                const rect = scheduleTimeline.getBoundingClientRect(); // 取得寬度
                setScheduleWidths(rect.width); // 更新到 state
            }
        };

        calculateWidth(); // 初始计算宽度

        // 监听窗口大小变化，重新计算宽度
        window.addEventListener('resize', calculateWidth);

        // 清理函数
        return () => {
            window.removeEventListener('resize', calculateWidth);
        };
    }, []);

    // Use Effect 2:從DB讀取別人的行程的schedule_item，按日期過濾
    useEffect(() => {
        let api = `http://localhost:3001/api/view2_schedule_include_show/${props.t_id}/${props.s_id}`;
        fetch(api)
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                } else {
                    return response.json();
                }
            })
            .then((data) => {
                setScheduleItems(data);
                setOrder(data.map(item => item.id)); // 初始排序
            })
            .catch((error) => {
                console.error('Error fetching attractions:', error);
            });
    }, [props.t_id, props.s_id]);

    // Use Effect 3: 獲取總預算
    useEffect(() => {
        const fetchBudget = async () => {
            try {
                const formattedDate = formatDate(props.date);
                console.log(`Fetching budget for s_id: ${props.s_id}, date: ${formattedDate}`);
                const response = await fetch(`http://localhost:3001/api/schedule_budget/${props.s_id}/${formattedDate}`);
                console.log('Budget response status:', response.status);
                if (response.ok) {
                    const data = await response.json();
                    console.log('Budget data:', data);
                    setTotalBudget(data.total_budget || 0);
                } else {
                    console.error('Budget API failed with status:', response.status);
                    const errorText = await response.text();
                    console.error('Budget API error:', errorText);
                    setTotalBudget(0);
                }
            } catch (error) {
                console.error('Error fetching budget:', error);
                setTotalBudget(0);
            }
        };

        if (props.s_id && props.date) {
            fetchBudget();
        }
    }, [props.s_id, props.date]);

    // Use Effect 4: 獲取投票數據和當前用戶投票狀態
    useEffect(() => {
        const fetchVotes = async () => {
            try {
                const formattedDate = formatDate(props.date);
                console.log(`Fetching votes for t_id: ${props.t_id}, s_id: ${props.s_id}, date: ${formattedDate}`);

                // 獲取總投票數據
                const response = await fetch(`http://localhost:3001/api/schedule_votes/${props.t_id}/${props.s_id}/${formattedDate}`);
                console.log('Votes response status:', response.status);
                if (response.ok) {
                    const data = await response.json();
                    console.log('Votes data:', data);
                    setVoteData(data);
                } else {
                    console.error('Votes API failed with status:', response.status);
                    const errorText = await response.text();
                    console.error('Votes API error:', errorText);
                }

                // 獲取當前用戶的投票狀態
                const currentUserId = 1; // 這裡需要從props或context獲取實際用戶ID
                const userVoteResponse = await fetch(`http://localhost:3001/api/user_vote/${props.t_id}/${props.s_id}/${currentUserId}/${formattedDate}`);
                if (userVoteResponse.ok) {
                    const userVoteData = await userVoteResponse.json();
                    setCurrentUserVote(userVoteData.vote_type || null);
                } else {
                    setCurrentUserVote(null);
                }
            } catch (error) {
                console.error('Error fetching votes:', error);
            }
        };

        if (props.t_id && props.s_id && props.date) {
            fetchVotes();
        }
    }, [props.t_id, props.s_id, props.date]);

    // 投票處理函數
    const handleVote = async (voteType) => {
        try {
            const currentUserId = 1; // 這裡需要當前用戶的ID，暫時使用固定值1，實際應該從props或context獲取
            const formattedDate = formatDate(props.date);

            // 如果點擊的是已經投過的票，則取消投票
            const finalVoteType = currentUserVote === voteType ? null : voteType;

            const response = await fetch(`http://localhost:3001/api/schedule_vote/${props.t_id}/${props.s_id}/${currentUserId}/${formattedDate}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ vote_type: finalVoteType }),
            });

            if (response.ok) {
                // 更新當前用戶投票狀態
                setCurrentUserVote(finalVoteType);

                // 重新獲取投票數據
                const voteResponse = await fetch(`http://localhost:3001/api/schedule_votes/${props.t_id}/${props.s_id}/${formattedDate}`);
                if (voteResponse.ok) {
                    const voteData = await voteResponse.json();
                    setVoteData(voteData);
                }
            }
        } catch (error) {
            console.error('Error voting:', error);
        }
    };

    // 渲染時間線格線
    const renderGrid = () => {
        const timeColumn = ['00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '23:59'];
        const lines = [];
        const intervalHeight = props.containerHeight / 25; // 調整為空間÷25

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

        return lines;
    };

    // 拖曳事件
    const handleDragStart = (e, id) => {
        setDraggedId(id);
        e.dataTransfer.effectAllowed = 'move';
    };
    const handleDragOver = (e, id) => {
        e.preventDefault();
        if (draggedId === id) return;
    };
    const handleDrop = (e, id) => {
        e.preventDefault();
        if (draggedId === null || draggedId === id) return;
        const newOrder = order.filter(sid => sid !== draggedId);
        const idx = newOrder.indexOf(id);
        newOrder.splice(idx, 0, draggedId);
        setOrder(newOrder);
        setDraggedId(null);
    };

    // 線條資料（示例，實際可根據 scheduleItems 關聯生成）
    const lineData = [
        { id: 'l1', from: order[0], to: order[1], detail: '行程1與行程2比較' },
        { id: 'l2', from: order[1], to: order[2], detail: '行程2與行程3比較' },
    ];

    // 線條交互
    const handleLineMouseOver = (e, line) => {
        const rect = e.target.getBoundingClientRect();
        setTooltip({
            visible: true,
            x: rect.left + rect.width / 2,
            y: rect.top - 10,
            detail: line.detail,
        });
        setHoveredLine(line.id);
    };
    const handleLineMouseOut = () => {
        setTooltip({ ...tooltip, visible: false });
        setHoveredLine(null);
    };
    const handleLineClick = (e, line) => {
        handleLineMouseOver(e, line);
    };

    // scheduleItem 卡片渲染（拖曳排序）
    const renderScheduleCards = () => {
        return order.map(id => {
            const item = scheduleItems.find(sch => sch.id === id);
            if (!item) return null;
            return (
                <div
                    key={item.id}
                    draggable
                    onDragStart={e => handleDragStart(e, item.id)}
                    onDragOver={e => handleDragOver(e, item.id)}
                    onDrop={e => handleDrop(e, item.id)}
                    style={{
                        width: '90%',
                        minHeight: 60,
                        margin: '10px auto',
                        background: '#f5f5f5',
                        border: '1px solid #ccc',
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'grab',
                        boxShadow: draggedId === item.id ? '0 0 10px #007bff' : '',
                    }}
                >
                    {item.name}
                </div>
            );
        });
    };

    // 線條渲染（SVG）
    const renderLines = () => {
        // 假設卡片垂直排列，簡單計算座標
        return lineData.map((line, idx) => {
            const fromIdx = order.indexOf(line.from);
            const toIdx = order.indexOf(line.to);
            const y1 = 40 + fromIdx * 80;
            const y2 = 40 + toIdx * 80;
            return (
                <svg
                    key={line.id}
                    style={{ position: 'absolute', left: 120, top: 0, pointerEvents: 'none' }}
                    width={100} height={300}
                >
                    <line
                        x1={0} y1={y1}
                        x2={100} y2={y2}
                        stroke={hoveredLine === line.id ? '#ff5722' : '#2196f3'}
                        strokeWidth={hoveredLine === line.id ? 6 : 3}
                        style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                        onMouseOver={e => handleLineMouseOver(e, line)}
                        onMouseOut={handleLineMouseOut}
                        onClick={e => handleLineClick(e, line)}
                    />
                </svg>
            );
        });
    };

    //組件的return（顯示單個schedule）
    return (
        //層級1：單個schedule 
        <div
            className="schedule scheduleShow"
            data-schedule-id={props.s_id}
            style={{
                position: 'relative',
                height: props.containerHeight,
                overflow: 'hidden',
                maxHeight: props.containerHeight,
                overflowY: 'hidden',
                overflowX: 'hidden',
                opacity: getScheduleOpacity(),
                transition: 'opacity 0.3s ease'
            }}
        >
            {/* //層級2：schedule的header  */}
            <div className="schedule_header">
                <div className="user_info">
                    <div className="user_avatar">
                        <img alt="User" src="https://www.iconpacks.net/icons/2/free-user-icon-3296-thumb.png" />
                    </div>
                    <div className="vote_buttons">
                        <div className="vote_bar_container">
                            {/* ...existing code... */}
                        </div>
                    </div>
                </div>
                <div className="budget_display">${totalBudget}</div>
                <span className="schedule_date">{props.title}</span>
            </div>

            {/* //層級3：schedule放内容的地方 */}
            <div className="schedule_timeline" style={{ position: 'relative', overflow: 'hidden', maxHeight: props.containerHeight }}>
                {renderGrid()}
                {/* 拖曳行程卡片 */}
                {renderScheduleCards()}
                {/* 比較線條 */}
                {renderLines()}
                {/* Tooltip */}
                {tooltip.visible && (
                    <div
                        style={{
                            position: 'fixed',
                            left: tooltip.x,
                            top: tooltip.y,
                            background: 'rgba(0,0,0,0.85)',
                            color: '#fff',
                            padding: '8px 12px',
                            borderRadius: 6,
                            fontSize: 14,
                            zIndex: 999,
                            pointerEvents: 'none',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        }}
                    >
                        {tooltip.detail}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ScheduleShow;

