import React, { useState } from "react";
import './profile.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faAddressCard, faEdit, faGlobe, faKey, faHistory } from '@fortawesome/free-solid-svg-icons';

// 假資料
const initialProfile = {
    uid: "U000123",
    avatar: "img/avatar/logo.jpg",
    email: "ming@example.com",
    account: "ming123",
    password: "******",
};

const initialHistory = [
    { "id": 1, "title": "台中藝術文化之旅", "date": "2024-06-15" },
    { "id": 2, "title": "墾丁海邊假期", "date": "2024-06-05" },
    { "id": 3, "title": "台南古蹟巡禮", "date": "2024-05-20" },
    { "id": 4, "title": "宜蘭溫泉放鬆", "date": "2024-05-12" },
    { "id": 5, "title": "新竹科學園區探索", "date": "2024-04-25" },
    { "id": 6, "title": "澎湖海島冒險", "date": "2024-04-18" }
];

function Profile() {
    const [profile, setProfile] = useState(initialProfile);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState(initialProfile);
    const [history] = useState(initialHistory);

    const handleEdit = () => setEditing(true);
    const handleCancel = () => {
        setEditing(false);
        setForm(profile);
    };
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };
    const handleSave = (e) => {
        e.preventDefault();
        setProfile(form);
        setEditing(false);
    };

    return (
        <div className="long_page">
            <div className="floating-shapes">
                <div className="shape" />
                <div className="shape" />
                <div className="shape" />
                <div className="shape" />
            </div>
            <div className="container">
                <div className="header">
                    <div className="logo">
                        <div className="logo-icon">
                            <FontAwesomeIcon icon={faGlobe} />
                        </div>
                        <h1 className="title">Vistour</h1>
                    </div>
                    <p className="subtitle">個人資料</p>
                </div>
                <div className="profile-card">
                    <div className="profile-card-horizontal">
                        <div className="profile-avatar-outer">
                            <div className="profile-avatar-section-horizontal">
                                <img src={profile.avatar} alt="頭貼" className="profile-avatar-horizontal" />
                            </div>
                        </div>


                        <div className="profile-info-section-horizontal">
                            {editing ? (
                                <form className="profile-form-horizontal" onSubmit={handleSave}>
                                    <div className="form-row-horizontal">
                                        <label htmlFor="uid"><FontAwesomeIcon icon={faUser} /> UID</label>
                                        <input
                                            type="text"
                                            id="uid"
                                            name="uid"
                                            className="form-control"
                                            value={form.uid}
                                            onChange={handleChange}
                                            disabled
                                        />
                                    </div>
                                    <div className="form-row-horizontal">
                                        <label htmlFor="email"><FontAwesomeIcon icon={faEnvelope} /> 信箱</label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            className="form-control"
                                            value={form.email}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-row-horizontal">
                                        <label htmlFor="account"><FontAwesomeIcon icon={faAddressCard} /> 帳號</label>
                                        <input
                                            type="text"
                                            id="account"
                                            name="account"
                                            className="form-control"
                                            value={form.account}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-row-horizontal">
                                        <label htmlFor="password"><FontAwesomeIcon icon={faKey} /> 密碼</label>
                                        <input
                                            type="password"
                                            id="password"
                                            name="password"
                                            className="form-control"
                                            value={form.password}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="profile-actions-horizontal">
                                        <button type="submit" className="btn">儲存</button>
                                        <button type="button" className="btn" onClick={handleCancel}>取消</button>
                                    </div>
                                </form>
                            ) : (
                                <div className="profile-info-horizontal">
                                    <div className="info-row-horizontal">
                                        <FontAwesomeIcon icon={faUser} />
                                        <span>UID：{profile.uid}</span>
                                    </div>
                                    <div className="info-row-horizontal">
                                        <FontAwesomeIcon icon={faEnvelope} />
                                        <span>信箱：{profile.email}</span>
                                    </div>
                                    <div className="info-row-horizontal">
                                        <FontAwesomeIcon icon={faAddressCard} />
                                        <span>帳號：{profile.account}</span>
                                    </div>
                                    <div className="info-row-horizontal">
                                        <FontAwesomeIcon icon={faKey} />
                                        <span>密碼：{profile.password}</span>
                                    </div>
                                    <div className="profile-actions-horizontal">
                                        <button className="btn" onClick={handleEdit}>
                                            <FontAwesomeIcon icon={faEdit} /> 編輯
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="profile-history-card">
                        <div className="profile-history-title">
                            <FontAwesomeIcon icon={faHistory} /> 歷史紀錄
                        </div>
                        <ul className="profile-history-list">
                            {history.length === 0 ? (
                                <li className="profile-history-empty">目前沒有參加過的行程</li>
                            ) : (
                                history.map(item => (
                                    <li key={item.id} className="profile-history-item">
                                        <span className="profile-history-date">{item.date}</span>
                                        <span className="profile-history-title">{item.title}</span>
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>
                </div>
                <div className="footer">
                    <p className="register-link">
                        <a href="/">回首頁</a>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Profile;