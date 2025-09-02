//不可編輯的schedule
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './schedule.css';
import ScheduleItem from './ScheduleItem.jsx'; // 引入 ScheduleItem 組件

const ScheduleShow = (props) => {
    // state
    const [attractions, setAttractions] = useState(props.initialAttractions || []); //景點
    const [scheduleItems, setScheduleItems] = useState([]);
    const [scheduleWidths, setScheduleWidths] = useState(0);
    const [totalBudget, setTotalBudget] = useState(0); // 新增：總預算
    const [voteData, setVoteData] = useState({ total_likes: 0, total_dislikes: 0 }); // 新增：投票數據
    const [currentUserVote, setCurrentUserVote] = useState(null); // 新增：當前用戶的投票狀態
    const [isAnimating, setIsAnimating] = useState(false); // 動畫狀態
    const [animationStage, setAnimationStage] = useState('idle'); // 動畫階段：idle, attractions-moving, schedule-sliding

    // 從 props 接收回調函數和重新排序狀態
    const { onAttractionSelect, onShowRoute, onHideRoute, isReordering = false, scheduleIndex = 0 } = props;

    // 使用 useMemo 來穩定化篩選條件，避免無限重渲染
    const filterConditions = useMemo(() => {
        return props.filterConditions || {};
    }, [props.filterConditions]);

    const { costRange = [0, 1000], selectedAttractions = [], selectedUsers = [] } = filterConditions;

    // 檢查預算是否在篩選範圍內
    const isBudgetInRange = useMemo(() => {
        return totalBudget >= costRange[0] && totalBudget <= costRange[1];
    }, [totalBudget, costRange]);

    // 檢查使用者是否被選中（相反邏輯：選中的使用者會變透明，沒選中的使用者正常顯示）
    const isUserSelected = useMemo(() => {
        return selectedUsers.length === 0 || !selectedUsers.includes(props.u_id);
    }, [selectedUsers, props.u_id]);

    // 計算透明度 - 若預算不在範圍內或使用者被選中（排除），則變透明
    const getScheduleOpacity = useCallback(() => {
        if (!isBudgetInRange || !isUserSelected) return 0.3;
        return 1;
    }, [isBudgetInRange, isUserSelected]);

    // 格式化日期，只保留YYYY-MM-DD部分
    const formatDate = useCallback((dateString) => {
        if (!dateString) return '';

        // 如果已經是 YYYY-MM-DD 格式，直接返回
        if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            return dateString;
        }

        // 否則轉換為 YYYY-MM-DD 格式
        const date = new Date(dateString);
        return date.toISOString().split('T')[0]; // 只取日期部分
    }, []);

    // 處理景點點擊
    const handleAttractionClick = useCallback((attraction) => {
        if (onAttractionSelect) {
            onAttractionSelect(attraction);
        }
    }, [onAttractionSelect]);

    // 處理行程點擊 - 顯示路線
    const handleScheduleClick = useCallback((event) => {
        if (!onShowRoute) {
            return;
        }

        if (scheduleItems.length === 0) {
            return;
        }

        // 構建路線資料 - 使用從 API 獲取的 scheduleItems
        const routeData = {
            scheduleId: props.s_id,
            tripId: props.t_id,
            title: props.title,
            attractions: scheduleItems.map(item => ({
                id: item.a_id,
                name: item.name,
                sequence: item.sequence,
                latitude: item.latitude,
                longitude: item.longitude,
                address: item.address,
                category: item.category
            }))
        };

        onShowRoute(routeData);
    }, [onShowRoute, scheduleItems, props.s_id, props.t_id, props.title]);

    // 處理景點容器點擊 - 阻止冒泡到行程點擊
    const handleAttractionContainerClick = useCallback((event, scheduleItem) => {
        event.stopPropagation(); // 阻止事件冒泡到行程容器

        // 直接選擇景點（page2.jsx 中的 handleAttractionSelect 會自動清除路線）
        handleAttractionClick(scheduleItem);
    }, [handleAttractionClick]);

    // 添加調試信息
    useEffect(() => {
        // Debug info removed
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

    // 定義景點分類顏色映射（邊框漸變顏色）
    const getCategoryColor = (category) => {
        const colorMap = {
            // 根據資料庫實際分類名稱對應
            '歷史文化': 'linear-gradient(135deg, #ffdfba, #ffbf69)', // Culture & Heritage - 橘色漸變
            '自然景觀': 'linear-gradient(135deg, #bae1ff, #baffc9)', // Scenic Spots - 藍綠色漸變
            '交通運輸': 'linear-gradient(135deg, #f9a1bc, #fbc4ab)', // Transport Rides - 粉色漸變
            '探索空間': 'linear-gradient(135deg, #dcd6f7, #a6b1e1)', // Discovery Spaces - 紫色漸變
            '公共廣場': 'linear-gradient(135deg, #c77dff, #ffd6ff)', // Public Squares - 紫粉色漸變

            // 保留舊的分類名稱以防萬一
            '文化古蹟': 'linear-gradient(135deg, #ffdfba, #ffbf69)',
            '風景名勝': 'linear-gradient(135deg, #bae1ff, #baffc9)',

            // 預設顏色
            'default': 'linear-gradient(135deg, #f0f0f0, #d0d0d0)'
        };

        return colorMap[category] || colorMap['default'];
    };

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
                // 檢測是否需要動畫（景點位置有變化）
                const needsAnimation = scheduleItems.length > 0 && 
                                     data.length > 0 && 
                                     JSON.stringify(data.map(item => ({ x: item.x, y: item.y, sequence: item.sequence }))) !== 
                                     JSON.stringify(scheduleItems.map(item => ({ x: item.x, y: item.y, sequence: item.sequence })));
                
                if (needsAnimation) {
                    // 開始動畫序列
                    setIsAnimating(true);
                    setAnimationStage('attractions-moving');
                    
                    // 1500ms 後切換到行程平移階段
                    setTimeout(() => {
                        setAnimationStage('schedule-sliding');
                        setScheduleItems(data);
                        
                        // 再過 800ms 結束動畫
                        setTimeout(() => {
                            setIsAnimating(false);
                            setAnimationStage('idle');
                        }, 800);
                    }, 1500);
                } else {
                    // 直接更新，不需要動畫
                    setScheduleItems(data);
                }
            })
            .catch((error) => {
                // Error handling silently
            });
    }, [props.t_id, props.s_id]);

    // Use Effect 3: 獲取總預算
    useEffect(() => {
        const fetchBudget = async () => {
            try {
                const formattedDate = formatDate(props.date);
                const response = await fetch(`http://localhost:3001/api/schedule_budget/${props.s_id}/${formattedDate}`);
                if (response.ok) {
                    const data = await response.json();
                    setTotalBudget(data.total_budget || 0);
                } else {
                    const errorText = await response.text();
                    setTotalBudget(0);
                }
            } catch (error) {
                setTotalBudget(0);
            }
        };

        if (props.s_id && props.date) {
            fetchBudget();
        }
    }, [props.s_id, props.date]); // formatDate 不需要在依賴項中，因為它是穩定的 useCallback

    // Use Effect 4: 獲取投票數據和當前用戶投票狀態
    useEffect(() => {
        const fetchVotes = async () => {
            try {
                const formattedDate = formatDate(props.date);

                // 獲取總投票數據
                const response = await fetch(`http://localhost:3001/api/schedule_votes/${props.t_id}/${props.s_id}/${formattedDate}`);
                if (response.ok) {
                    const data = await response.json();
                    setVoteData(data);
                } else {
                    const errorText = await response.text();
                    // Handle error silently
                }

                // 獲取當前用戶的投票狀態
                const currentUserId = 1; // 這裡需要從props或context獲取實際用戶ID
                const userVoteResponse = await fetch(`http://localhost:3001/api/user_vote/${props.t_id}/${props.s_id}/${currentUserId}`);
                if (userVoteResponse.ok) {
                    const userVoteData = await userVoteResponse.json();
                    setCurrentUserVote(userVoteData.vote_type || null);
                } else {
                    setCurrentUserVote(null);
                }
            } catch (error) {
                // Handle error silently
            }
        };

        if (props.t_id && props.s_id && props.date) {
            fetchVotes();
        }
    }, [props.t_id, props.s_id, props.date, formatDate]);

    // 投票處理函數
    const handleVote = useCallback(async (voteType) => {
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
                // 重新獲取用戶投票狀態
                const userVoteResponse = await fetch(`http://localhost:3001/api/user_vote/${props.t_id}/${props.s_id}/${currentUserId}`);
                if (userVoteResponse.ok) {
                    const userVoteData = await userVoteResponse.json();
                    setCurrentUserVote(userVoteData.vote_type || null);
                }

                // 重新獲取投票數據
                const voteResponse = await fetch(`http://localhost:3001/api/schedule_votes/${props.t_id}/${props.s_id}/${formattedDate}`);
                if (voteResponse.ok) {
                    const voteData = await voteResponse.json();
                    setVoteData(voteData);
                }
            } else {
                // Error handling silently
            }
        } catch (error) {
            // Handle error silently
        }
    }, [currentUserVote, props.t_id, props.s_id, props.date, formatDate]); // 添加 formatDate 到依賴項

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
            className={`schedule scheduleShow ${isAnimating ? `animating-${animationStage}` : ''}`}
            data-schedule-id={props.s_id}
            onClick={handleScheduleClick}
            style={{
                position: 'relative',
                height: props.containerHeight,
                overflow: 'hidden',
                maxHeight: props.containerHeight,
                overflowY: 'hidden',
                overflowX: 'hidden',
                opacity: getScheduleOpacity(),
                transition: isAnimating ? 
                    (animationStage === 'schedule-sliding' ? 'transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.3s ease' : 'opacity 0.3s ease') :
                    'opacity 0.3s ease',
                cursor: 'pointer',
                transform: isAnimating && animationStage === 'schedule-sliding' ? 
                    'translateX(10px) scale(1.02)' : 'none'
            }}
            title="Click to show route"
        >
            {/* //層級2：schedule的header  */}
            <div className="schedule_header">
                {/* 讚/倒讚按鈕區域 - 移到頂部 */}
                <div className="vote_buttons_top">
                    <button
                        className={`vote_button like_button ${currentUserVote === 'like' ? 'active' : ''}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleVote('like');
                        }}
                        title={currentUserVote === 'like' ? `已讚 - 點擊取消 (${voteData.total_likes})` : `讚 (${voteData.total_likes})`}
                    >
                        👍
                    </button>
                    <button
                        className={`vote_button dislike_button ${currentUserVote === 'dislike' ? 'active' : ''}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleVote('dislike');
                        }}
                        title={currentUserVote === 'dislike' ? `已倒讚 - 點擊取消 (${voteData.total_dislikes})` : `倒讚 (${voteData.total_dislikes})`}
                    >
                        👎
                    </button>
                </div>

                <div className="user_info" onClick={(e) => e.stopPropagation()}>
                    <div className="user_avatar">
                        <img alt="User" src="https://www.iconpacks.net/icons/2/free-user-icon-3296-thumb.png" />
                    </div>
                </div>
                <div className="budget_display" onClick={(e) => e.stopPropagation()}>${totalBudget}</div>
                <span
                    className="schedule_date"
                    style={{ cursor: 'inherit' }}
                >
                    {props.title}
                </span>

                {/* 比較進度條 - 移到下方並縮小 */}
                <div className="comparison_progress">
                    <div className="vote_bar_container_small">
                        <div
                            className="vote_bar_small like_section_small"
                            style={{
                                width: voteData.total_likes + voteData.total_dislikes === 0
                                    ? '50%'
                                    : `${(voteData.total_likes / (voteData.total_likes + voteData.total_dislikes)) * 100}%`,
                                backgroundColor: '#4CAF50',
                            }}
                        />
                        <div
                            className="vote_bar_small dislike_section_small"
                            style={{
                                width: voteData.total_likes + voteData.total_dislikes === 0
                                    ? '50%'
                                    : `${(voteData.total_dislikes / (voteData.total_likes + voteData.total_dislikes)) * 100}%`,
                                backgroundColor: '#f44336',
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* //層級3：schedule放内容的地方 */}
            <div className="schedule_timeline" style={{ position: 'relative', overflow: 'hidden', maxHeight: props.containerHeight }}>
                {renderGrid()}

                {/* 顯示景點（已經在資料庫的） */}
                {scheduleItems.map((scheduleItem) => (
                    <div
                        key={`schedule-item-wrapper-${scheduleItem.id}-${scheduleItem.a_id}`}
                        onClick={(event) => handleAttractionContainerClick(event, scheduleItem)}
                        style={{ 
                            cursor: 'pointer',
                            transition: isAnimating && animationStage === 'attractions-moving' ? 
                                'transform 1.5s cubic-bezier(0.4, 0.0, 0.2, 1)' : 
                                'none'
                        }}
                        className={`schedule-item-wrapper ${isAnimating ? `animating-${animationStage}` : ''}`}
                    >
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
                            categoryColor={getCategoryColor(scheduleItem.category)} // 傳遞分類顏色
                            category={scheduleItem.category} // 傳遞分類名稱
                            isAnimating={isAnimating}
                            animationStage={animationStage}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ScheduleShow;

