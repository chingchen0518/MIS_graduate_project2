import React, { useEffect, useState } from 'react';
import Page3 from '../page3/Page3.jsx';


const Confirmed = () => {
    const trip = JSON.parse(localStorage.getItem('trip'));
    const [loading, setLoading] = useState(true);
    const [maxSids, setMaxSids] = useState([]);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!trip || !trip.tid) {
            setError('找不到行程資訊');
            setLoading(false);
            return;
        }

        (async () => {
            try {
                const api = 'http://localhost:3001/api/evaluate/max-good-bad';
                const res = await fetch(api, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tid: trip.tid }),
                });

                const data = await res.json();
                console.log('📌 API 回傳:', data);

                if (res.ok) {
                    setMaxSids(Array.isArray(data.maxSids) ? data.maxSids : []);
                    setMessage(data.message ? String(data.message) : '');
                } else {
                    setError(data.message ? String(data.message) : '資料取得失敗');
                    console.error('⚠️ 後端錯誤細節:', data.error);
                }
            } catch (err) {
                setError('伺服器錯誤，請稍後再試');
                console.error(err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading) return <div>載入中...</div>;
    if (error) return <div>{error && String(error)}</div>;

    return (
        <div>
            {/* 顯示後端訊息 */}
            {message && <p>系統訊息：{message}</p>}

            {/* A 介面：多筆最大 s_id */}
            {maxSids.length > 1 && (
                <div>
                    <h2>A 介面：有多筆最大分數</h2>
                    <ul>
                        {maxSids.map(sid => (
                            <li key={sid}>s_id: {sid}</li>
                        ))}
                        <Page3 />
                    </ul>
                </div>
            )}

            {/* B 介面：僅一筆最大 s_id */}
            {maxSids.length === 1 && (
                <div>
                    <h2>B 介面：僅一筆最大分數</h2>
                    <div>s_id: {maxSids[0]}</div>
                </div>
            )}

            {/* 沒資料 */}
            {maxSids.length === 0 && <div>查無資料</div>}
        </div>
    );
};

export default Confirmed;
