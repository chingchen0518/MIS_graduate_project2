//不可編輯的schedule
import React, { useState, useEffect} from 'react';
import './schedule.css';
import ScheduleItem from './ScheduleItem.jsx'; // 引入 ScheduleItem 組件

const ScheduleShow = (props) => {
    // state
    const [attractions, setAttractions] = useState(props.initialAttractions || []); //景點
    const [scheduleItems, setScheduleItems] = useState([]);
    const [scheduleWidths, setScheduleWidths] = useState(0);
    const [totalBudget, setTotalBudget] = useState(0); // 新增：總預算
    const [voteData, setVoteData] = useState({ total_likes: 0, total_dislikes: 0 }); // 新增：投票數據

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
            }else{
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
                const response = await fetch(`http://localhost:3001/api/schedule_budget/${props.t_id}/${props.s_id}`);
                if (response.ok) {
                    const data = await response.json();
                    setTotalBudget(data.total_budget || 0);
                }
            } catch (error) {
                console.error('Error fetching budget:', error);
            }
        };

        if (props.t_id && props.s_id) {
            fetchBudget();
        }
    }, [props.t_id, props.s_id]);

    // Use Effect 4: 獲取投票數據
    useEffect(() => {
        const fetchVotes = async () => {
            try {
                const response = await fetch(`http://localhost:3001/api/schedule_votes/${props.t_id}/${props.s_id}`);
                if (response.ok) {
                    const data = await response.json();
                    setVoteData(data);
                }
            } catch (error) {
                console.error('Error fetching votes:', error);
            }
        };

        if (props.t_id && props.s_id) {
            fetchVotes();
        }
    }, [props.t_id, props.s_id]);

    // 投票處理函數
    const handleVote = async (voteType) => {
        try {
            // 這裡需要當前用戶的ID，暫時使用固定值1，實際應該從props或context獲取
            const currentUserId = 1; 
            
            const response = await fetch(`http://localhost:3001/api/schedule_vote/${props.t_id}/${props.s_id}/${currentUserId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ vote_type: voteType }),
            });

            if (response.ok) {
                // 重新獲取投票數據
                const voteResponse = await fetch(`http://localhost:3001/api/schedule_votes/${props.t_id}/${props.s_id}`);
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

    //組件的return（顯示單個schedule）
    return (
        //層級1：單個schedule 
        <div 
            className="schedule scheduleShow"
            style={{
                position: 'relative',
                height: props.containerHeight,
                overflow: 'hidden',
                maxHeight: props.containerHeight,
                overflowY: 'hidden',
                overflowX: 'hidden',
            }}
        >
            {/* //層級2：schedule的header  */}
            <div className="schedule_header">
                <div className="user_info">
                    <div className="user_avatar">
                        <img alt="User" src="https://www.iconpacks.net/icons/2/free-user-icon-3296-thumb.png"/>
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
                        nextAId={attractions.find(a => a.sequence === attraction.sequence + 1)?.a_id ?? null}

                    />
                ))}
            </div>
        </div>
    );
};

export default ScheduleShow;

