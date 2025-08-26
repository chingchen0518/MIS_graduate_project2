import React from 'react';

function ShowTimeModal({ deadline, time, onClose }) {
    return (
        <div className="modal">
            <div className="modal-content">
                <h3>目前倒數時間與行程時間</h3>
                <p>截止時間（deadline）：{deadline ? deadline : '未設定'}</p>
                <p>行程時間（time）：{time ? time : '未設定'}</p>
                <div className="modal-buttons">
                    <button onClick={onClose}>關閉</button>
                </div>
            </div>
        </div>
    );
}

export default ShowTimeModal;