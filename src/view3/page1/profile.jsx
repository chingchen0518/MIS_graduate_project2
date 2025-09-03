import React, { useState, useEffect } from "react";
import './profile.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faAddressCard, faPlus, faSignOutAlt, faGlobe, faKey, faHistory } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from "react-router-dom";

let BASE_URL = import.meta.env.VITE_API_URL;
const PORT = import.meta.env.PORT || 3001;
if (BASE_URL && !BASE_URL.startsWith('http')) {
    BASE_URL = `http://${BASE_URL}`;
}
if (PORT) {
    BASE_URL = `${BASE_URL}:${PORT}`;
}

function Profile() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));
    const trip = JSON.parse(localStorage.getItem('trip')) || null;
    const [profile, setProfile] = useState(null);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState(user);

    useEffect(() => {
        if (!user) {
            setTimeout(() => {
                navigate('/Login');
            }, 500);
        }
    }, [user, navigate]);

    useEffect(() => {
        if (user?.uid) {
            fetch(`${BASE_URL}/api/user/${user.uid}`)
                .then(res => res.json())
                .then(data => setProfile(data));
        }
    }, [user]);

    if (!profile) {
        return <div>Not logged in, redirecting...</div>;
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
            <div className="main_container">
                <div className="all_header">
                    <div className="all_logo">
                        <div className="all_logo-icon">
                            <FontAwesomeIcon icon={faGlobe} />
                        </div>
                        <h1 className="all_title">Vistour</h1>
                    </div>
                    <p className="all_subtitle">Profile</p>
                </div>
                <div className="profile-card">
                    <div className="profile-card-horizontal">
                        <div className="profile-avatar-outer">
                            <div className="profile-avatar-section-horizontal">
                                <img src={`/img/avatar/${profile.u_img}`} alt="Avatar" className="profile-avatar-horizontal" />
                            </div>
                        </div>


                        <div className="profile-info-section-horizontal">
                            {editing ? (
                                <form className="profile-form-horizontal" onSubmit={handleSave}>
                                    <div className="profile-info-horizontal">
                                        <div className="all_input-with-icon">
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
                                            <small className="note">This field is not editable</small>
                                        </div>
                                        <div className="all_input-with-icon">
                                            <FontAwesomeIcon icon={faEnvelope} />
                                            <input
                                                type="email"
                                                id="email"
                                                name="email"
                                                className="form-control"
                                                value={form.email}
                                                onChange={handleChange}
                                                required
                                                placeholder="Email"
                                            />
                                        </div>
                                        <div className="all_input-with-icon">
                                            <FontAwesomeIcon icon={faAddressCard} />
                                            <input
                                                type="text"
                                                id="account"
                                                name="account"
                                                className="form-control"
                                                value={form.account}
                                                onChange={handleChange}
                                                required
                                                placeholder="Account"
                                            />
                                        </div>
                                        <div className="all_input-with-icon">
                                            <FontAwesomeIcon icon={faKey} />
                                            <input
                                                type="password"
                                                id="password"
                                                name="password"
                                                className="form-control"
                                                value="******"
                                                onChange={handleChange}
                                                required
                                                placeholder="Password"
                                            />
                                        </div>
                                    </div>

                                    <div className="profile-actions-horizontal">
                                        <button type="submit" className="all_btn">Save</button>
                                        <button type="button" className="all_btn" onClick={handleCancel}>Cancel</button>
                                    </div>
                                </form>
                            ) : (
                                <div className="profile-info-horizontal">
                                    <div className="all_input-with-icon">
                                        <FontAwesomeIcon icon={faUser} />
                                        <span>User ID: {profile.u_id}</span>
                                    </div>
                                    <div className="all_input-with-icon">
                                        <FontAwesomeIcon icon={faEnvelope} />
                                        <span>Email: {profile.u_email}</span>
                                    </div>
                                    <div className="all_input-with-icon">
                                        <FontAwesomeIcon icon={faAddressCard} />
                                        <span>Account: {profile.u_account}</span>
                                    </div>
                                    <div className="all_input-with-icon">
                                        <FontAwesomeIcon icon={faKey} />
                                        <span>Password: ******</span>
                                    </div>
                                    <div className="profile-actions-horizontal">
                                        {/* <button className="all_btn" onClick={handleEdit}>
                                            <FontAwesomeIcon icon={faEdit} /> 編輯
                                        </button> */}

                                        <button className="all_btn" onClick={() => navigate('/Backend')}>
                                            <FontAwesomeIcon icon={faPlus} /> Trips Attended
                                        </button>
                                        <button className="all_btn" onClick={() => navigate('/logout')}>
                                            <FontAwesomeIcon icon={faSignOutAlt} /> Logout
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="profile-history-card">
                        <div className="profile-history-title">
                            <FontAwesomeIcon icon={faHistory} /> Trips Attended
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
                                <li className="profile-history-empty">No Trips Attended</li>
                            )}
                        </ul>
                    </div>
                </div>
                <div className="all_footer">
                    <p className="register-link">
                        <a href="/">回首頁</a>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Profile;