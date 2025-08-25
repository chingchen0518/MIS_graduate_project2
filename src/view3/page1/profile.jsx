import React, { useState, useEffect } from "react";
import './profile.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faAddressCard, faPlus, faSignOutAlt, faGlobe, faKey, faHistory } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from "react-router-dom";

function Profile() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));
    const trip = JSON.parse(localStorage.getItem('trip')) || null;
    const [profile, setProfile] = useState(null);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState(user);

    useEffect(() => {
        if (!user) {
            alert('尚未登入， 即將跳轉至登入頁面');
            setTimeout(() => {
                navigate('/Login');
            }, 500);
        }
    }, [user, navigate]);

    useEffect(() => {
        if (user?.uid) {
            fetch(`/api/user/${user.uid}`)
                .then(res => res.json())
                .then(data => setProfile(data));
        }
    }, [user]);

    if (!profile) {
        return <div>尚未登入，正在跳轉中...</div>;
    }

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
                                <img src={`/img/avatar/${profile.u_img}`} alt="頭貼" className="profile-avatar-horizontal" />
                            </div>
                        </div>


                        <div className="profile-info-section-horizontal">
                            {editing ? (
                                <form className="profile-form-horizontal" onSubmit={handleSave}>
                                    <div className="profile-info-horizontal">
                                        <div className="input-with-icon">
                                            <FontAwesomeIcon icon={faUser} />
                                            <input
                                                type="text"
                                                id="uid"
                                                name="uid"
                                                className="form-control"
                                                value={form.id}
                                                onChange={handleChange}
                                                readOnly
                                                placeholder="UID"
                                            />
                                            <small className="note">此欄位無法修改</small>
                                        </div>
                                        <div className="input-with-icon">
                                            <FontAwesomeIcon icon={faEnvelope} />
                                            <input
                                                type="email"
                                                id="email"
                                                name="email"
                                                className="form-control"
                                                value={form.email}
                                                onChange={handleChange}
                                                required
                                                placeholder="信箱"
                                            />
                                        </div>
                                        <div className="input-with-icon">
                                            <FontAwesomeIcon icon={faAddressCard} />
                                            <input
                                                type="text"
                                                id="account"
                                                name="account"
                                                className="form-control"
                                                value={form.account}
                                                onChange={handleChange}
                                                required
                                                placeholder="帳號"
                                            />
                                        </div>
                                        <div className="input-with-icon">
                                            <FontAwesomeIcon icon={faKey} />
                                            <input
                                                type="password"
                                                id="password"
                                                name="password"
                                                className="form-control"
                                                value="******"
                                                onChange={handleChange}
                                                required
                                                placeholder="密碼"
                                            />
                                        </div>
                                    </div>

                                    <div className="profile-actions-horizontal">
                                        <button type="submit" className="btn">儲存</button>
                                        <button type="button" className="btn" onClick={handleCancel}>取消</button>
                                    </div>
                                </form>
                            ) : (
                                <div className="profile-info-horizontal">
                                    <div className="input-with-icon">
                                        <FontAwesomeIcon icon={faUser} />
                                        <span>UID：{profile.u_id}</span>
                                    </div>
                                    <div className="input-with-icon">
                                        <FontAwesomeIcon icon={faEnvelope} />
                                        <span>信箱：{profile.u_email}</span>
                                    </div>
                                    <div className="input-with-icon">
                                        <FontAwesomeIcon icon={faAddressCard} />
                                        <span>帳號：{profile.u_account}</span>
                                    </div>
                                    <div className="input-with-icon">
                                        <FontAwesomeIcon icon={faKey} />
                                        <span>密碼：******</span>
                                    </div>
                                    <div className="profile-actions-horizontal">
                                        {/* <button className="btn" onClick={handleEdit}>
                                            <FontAwesomeIcon icon={faEdit} /> 編輯
                                        </button> */}
                                        <button className="btn" onClick={() => navigate('/')}>
                                            <FontAwesomeIcon icon={faPlus} /> 新增旅程
                                        </button>
                                        <button className="btn" onClick={() => navigate('/logout')}>
                                            <FontAwesomeIcon icon={faSignOutAlt} /> 登出
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="profile-history-card">
                        <div className="profile-history-title">
                            <FontAwesomeIcon icon={faHistory} /> 參加過的行程
                        </div>
                        
                        <ul className="profile-history-list">
                            {profile.trips && profile.trips.length > 0 ? (
                                profile.trips.map(trip => (
                                    <li key={trip.t_id} className="profile-history-item">
                                        <span className="profile-history-date">{trip.s_date}</span>
                                        <button
                                            className="profile-history-title"
                                            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}
                                            onClick={() => {
                                                // 存入最新的 trip 資料
                                                localStorage.setItem('trip', JSON.stringify({
                                                    tid: trip.t_id,
                                                    title: trip.title,
                                                }));
                                                navigate('/Vistour');
                                            }}
                                        >
                                            {trip.title}
                                        </button>
                                    </li>
                                ))
                            ) : (
                                <li className="profile-history-empty">目前沒有參加過的行程</li>
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