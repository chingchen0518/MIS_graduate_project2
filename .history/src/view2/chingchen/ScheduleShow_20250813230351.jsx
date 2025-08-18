//不可編輯的schedule
import React, { useState, useEffect} from 'react';
import './schedule.css';
import ScheduleItem from './ScheduleItem.jsx'; // 引入 ScheduleItem 組件

const ScheduleShow = (props) => {
    // state
    const [attractions, setAttractions] = useState(props.initialAttractions || []); //景點
    const [scheduleItems, setScheduleItems] = useState([]);
    const [scheduleWidths, setScheduleWidths] = useState(0);
    const [scheduleBudget, setScheduleBudget] = useState(0); // 新增：預算總和
    const [voteStats, setVoteStats] = useState({ good_count: 0, bad_count: 0, total_votes: 0 }); // 新增：投票統計
    const [userVote, setUserVote] = useState(null); // 新增：用戶投票狀態

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

    // Use Effect 3: 獲取Schedule的預算總和
    useEffect(() => {
        if (props.s_id) {
            fetch(`http://localhost:3001/api/schedule_budget/${props.s_id}`)
                .then(response => response.json())
                .then(result => {
                    if (result.success) {
                        setScheduleBudget(result.data.total_budget);
                    }
                })
                .catch(error => {
                    console.error('Error fetching schedule budget:', error);
                });
        }
    }, [props.s_id]);

    // Use Effect 4: 獲取Schedule的投票統計
    useEffect(() => {
        if (props.s_id) {
            fetch(`http://localhost:3001/api/schedule_votes/${props.s_id}`)
                .then(response => response.json())
                .then(result => {
                    if (result.success) {
                        setVoteStats(result.data);
                    }
                })
                .catch(error => {
                    console.error('Error fetching vote stats:', error);
                });
        }
    }, [props.s_id]);

    // 處理投票的函數
    const handleVote = (voteType) => {
        // 這裡假設有一個當前用戶ID，實際上應該從props或context獲取
        const currentUserId = 1; // 暫時固定為1，實際應用中需要動態獲取

        const voteData = {
            u_id: currentUserId,
            s_id: props.s_id,
            t_id: props.t_id,
            vote_type: voteType
        };

        fetch('http://localhost:3001/api/schedule_vote', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(voteData)
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                setUserVote(voteType);
                // 重新獲取投票統計
                fetch(`http://localhost:3001/api/schedule_votes/${props.s_id}`)
                    .then(response => response.json())
                    .then(result => {
                        if (result.success) {
                            setVoteStats(result.data);
                        }
                    });
            }
        })
        .catch(error => {
            console.error('Error voting:', error);
        });
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
                    <div className="user_avatar">
                        <img alt="User" src="https://www.iconpacks.net/icons/2/free-user-icon-3296-thumb.png"/>
                    </div>
                    <div className="budget_display">$350</div>

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

