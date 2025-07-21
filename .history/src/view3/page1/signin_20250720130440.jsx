import React, { useState } from "react";
import './signin.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlobe, faEnvelope, faUser, faLock, faAddressCard } from '@fortawesome/free-solid-svg-icons';


const initialState = {
    name: "",
    email: "",
    account: "",
    password: "",
    confirmPassword: "",
};

function Signin() {
    const [form, setForm] = useState(initialState);
    const [errors, setErrors] = useState([]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const validate = () => {
        const errs = [];
        if (!form.name.trim()) errs.push("姓名不能為空");
        if (!form.email.trim()) errs.push("電子郵件不能為空");
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.push("請輸入有效的電子郵件地址");
        if (!form.password) errs.push("密碼不能為空");
        else if (form.password.length < 6) errs.push("密碼必須至少6個字符");
        if (form.password !== form.confirmPassword) errs.push("兩次輸入的密碼不一致");
        return errs;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        setErrors(errs);
        if (errs.length === 0) {
            try {
                const response = await fetch('/api/view3_in', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(form),
                });

                console.log('response status:', response.status);

                let data = null;
                try {
                    data = await response.json();
                    console.log('response data:', data);
                } catch (jsonErr) {
                    console.error('response not json:', jsonErr);
                }

                if (response.ok) {
                    alert('註冊成功！');
                    setForm(initialState);
                    setErrors([]);
                } else {
                    setErrors([data?.message || `註冊失敗 (狀態碼: ${response.status})`]);
                }
            } catch (err) {
                console.error('fetch error:', err);
                setErrors([`發生錯誤，請確認伺服器已啟動。錯誤訊息: ${err.message}`]);
            }
        }
    };

    return (
        <div className="page">
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
                    <p className="subtitle">註冊新帳號</p>
                </div>

                <div className="body">
                    {errors.length > 0 && (
                        <div className="error-message">
                            <ul>
                                {errors.map((err, idx) => (
                                    <li key={idx}>{err}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="name">姓名</label>
                            <div className="input-with-icon">
                                <FontAwesomeIcon icon={faUser} />
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    className="form-control"
                                    placeholder="請輸入姓名"
                                    value={form.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">電子郵件</label>
                            <div className="input-with-icon">
                                <FontAwesomeIcon icon={faEnvelope} />
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    className="form-control"
                                    placeholder="請輸入電子郵件"
                                    value={form.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label htmlFor="account">帳號</label>
                            <div className="input-with-icon">
                                <FontAwesomeIcon icon={faAddressCard} />
                                <input
                                    type="text"
                                    id="account"
                                    name="account"
                                    className="form-control"
                                    placeholder="請輸入帳號"
                                    value={form.account}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="password">密碼</label>
                                <div className="input-with-icon">
                                    <FontAwesomeIcon icon={faLock} />
                                    <input
                                        type="password"
                                        id="password"
                                        name="password"
                                        className="form-control"
                                        placeholder="請輸入密碼"
                                        value={form.password}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="confirmPassword">確認密碼</label>
                                <div className="input-with-icon">
                                    <FontAwesomeIcon icon={faLock} />
                                    <input
                                        type="password"
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        className="form-control"
                                        placeholder="請再次輸入密碼"
                                        value={form.confirmPassword}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <button type="submit" className="btn">註冊</button>
                    </form>
                </div>

                <div className="footer">
                    <p className="login-link">
                        已有帳號？ <a href="/Login">立即登入</a>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default  Signin;