//不可編輯的schedule
import React, { useState, useEffect } from 'react';
import './schedule.css';
import ScheduleItem from './ScheduleItem.jsx'; // 引入 ScheduleItem 組件

const ScheduleShow = (props) => {
    // state
    const [attractions, setAttractions] = useState(props.initialAttractions || []); //景點
    const [scheduleItems, setScheduleItems] = useState([]);
    const [scheduleWidths, setScheduleWidths] = useState(0);
    const [totalBudget, setTotalBudget] = useState(0); // 新增：總預算
    const [voteData, setVoteData] = useState({ total_likes: 0, total_dislikes: 0 }); // 新增：投票數據
    const [tripMembers, setTripMembers] = useState([]); // 新增：行程成員
    const [currentUserId] = useState(1); // 當前用戶ID，實際應該從props或context獲取

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

    // Use Effect 4: 獲取投票數據
    useEffect(() => {
        const fetchVotes = async () => {
            try {
                const formattedDate = formatDate(props.date);
                console.log(`Fetching votes for t_id: ${props.t_id}, s_id: ${props.s_id}, date: ${formattedDate}`);
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
            } catch (error) {
                console.error('Error fetching votes:', error);
            }
        };

        if (props.t_id && props.s_id && props.date) {
            fetchVotes();
        }
    }, [props.t_id, props.s_id, props.date]);

    // Use Effect 5: 獲取行程成員
    useEffect(() => {
        const fetchTripMembers = async () => {
            try {
                console.log(`Fetching trip members for t_id: ${props.t_id}`);
                const response = await fetch(`http://localhost:3001/api/trip_members/${props.t_id}`);
                if (response.ok) {
                    const data = await response.json();
                    console.log('Trip members data:', data);
                    setTripMembers(data);
                } else {
                    console.error('Trip members API failed with status:', response.status);
                }
            } catch (error) {
                console.error('Error fetching trip members:', error);
            }
        };

        if (props.t_id) {
            fetchTripMembers();
        }
    }, [props.t_id]);

    // 投票處理函數
    const handleVote = async (voteType) => {
        try {
            // 這裡需要當前用戶的ID，暫時使用固定值1，實際應該從props或context獲取
            const formattedDate = formatDate(props.date);

            const response = await fetch(`http://localhost:3001/api/schedule_vote/${props.t_id}/${props.s_id}/${currentUserId}/${formattedDate}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ vote_type: voteType }),
            });

            if (response.ok) {
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

    // 生成投票光圈的函數
    const renderVoteRing = (voteType, voteCount) => {
        const totalMembers = tripMembers.length || 5; // 如果沒有成員資料，預設5人
        const radius = 15; // 光圈半徑
        const centerX = 20; // 中心點X
        const centerY = 20; // 中心點Y
        
        // 生成虛線陣列
        const dashArray = [];
        for (let i = 0; i < totalMembers; i++) {
            const angle = (i * 360) / totalMembers - 90; // 從12點鐘方向開始，順時針分布
            const isLit = i < voteCount; // 是否點亮
            const isCurrentUser = i === 0; // 假設當前用戶總是在12點鐘方向
            
            dashArray.push({
                angle,
                isLit,
                isCurrentUser
            });
        }

        return (
            <div className={`vote-ring vote-ring-${voteType}`}>
                <svg width="40" height="40" viewBox="0 0 40 40">
                    {dashArray.map((dash, index) => {
                        const x = centerX + radius * Math.cos((dash.angle * Math.PI) / 180);
                        const y = centerY + radius * Math.sin((dash.angle * Math.PI) / 180);
                        
                        return (
                            <circle
                                key={index}
                                cx={x}
                                cy={y}
                                r="2"
                                className={`vote-dash ${dash.isLit ? 'lit' : 'unlit'} ${dash.isCurrentUser ? 'current-user' : ''}`}
                                fill={dash.isLit ? (voteType === 'like' ? '#4CAF50' : '#F44336') : '#E0E0E0'}
                                stroke={dash.isCurrentUser ? '#FFD700' : 'none'}
                                strokeWidth={dash.isCurrentUser ? '1' : '0'}
                            />
                        );
                    })}
                </svg>
                <div className="vote-emoji">
                    {voteType === 'like' ? '👍' : '👎'}
                </div>
            </div>
        );
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
                        <button
                            className="vote_button like_button"
                            onClick={() => handleVote('like')}
                            title="讚"
                        >
                            👍 {voteData.total_likes}
                        </button>
                        <button
                            className="vote_button dislike_button"
                            onClick={() => handleVote('dislike')}
                            title="倒讚"
                        >
                            👎 {voteData.total_dislikes}
                        </button>
                    </div>
                </div>
                <div className="budget_display">${totalBudget}</div>
                <span className="schedule_date">{props.title}</span>
            </div>

            {/* //層級3：schedule放内容的地方 */}
            <div className="schedule_timeline" style={{ position: 'relative', overflow: 'hidden', maxHeight: props.containerHeight }}>
                {renderGrid()}

                {/* 顯示景點（已經在資料庫的） */}
                {scheduleItems.map((scheduleItem) => (
                    <ScheduleItem
                        key={`schedule-item-${scheduleItem.id}-${scheduleItem.a_id}`}
                        s_id={scheduleItem.id}
                        name={scheduleItem.name}
                        position={{ x: scheduleItem.x, y: scheduleItem.y }} // x和y的位置，傳入object
                        width={scheduleWidths} // 使用計算出的寬度
                        height={scheduleItem.height} // 使用從資料庫獲取的高度
                        editable={false} // 不可編輯
                        intervalHeight={props.intervalHeight}
                        nextAId={null} // 在Show模式下不需要next景點資訊
                        a_id={scheduleItem.a_id}
                        isSelected={selectedAttractions.includes(scheduleItem.a_id)} // 傳遞是否被選中
                    />
                ))}
            </div>
        </div>
    );
};

export default ScheduleShow;

