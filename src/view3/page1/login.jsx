// login.jsx
import React, { useState } from 'react';
import './login.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock, faSignInAlt, faGlobe, faCheckCircle, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!email || !password) {
            setError('請輸入電子郵件和密碼！');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('請輸入有效的電子郵件格式');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();
            if (res.ok) {
                setSuccess(data.message || '登入成功！');
                setTimeout(() => {
                    window.location.href = data.redirect || '/';
                }, 1500);
            } else {
                setError(data.message || '登入失敗！');
            }
        } catch (err) {
            setError('發生錯誤，請稍後再試');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="floating-shapes">
                <div className="shape" />
                <div className="shape" />
                <div className="shape" />
                <div className="shape" />
            </div>
            <div className="login-container">
                <div className="login-header">
                    <div className="login-logo">
                        <div className="login-logo-icon">
                            <FontAwesomeIcon icon={faGlobe} />
                        </div>
                        <h1 className="login-title">Vistour</h1>
                    </div>
                    <p className="login-subtitle">你的旅遊好幫手</p>
                </div>
                <div className="login-body">
                    {success && (
                        <div className="message success">
                            <FontAwesomeIcon icon={faCheckCircle} />
                            <span>{success}</span>
                        </div>
                    )}
                    {error && (
                        <div className="message error">
                            <FontAwesomeIcon icon={faExclamationTriangle} />
                            <span>{error}</span>
                        </div>
                    )}
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="email">電子郵件</label>
                            <div className="input-with-icon">
                                <FontAwesomeIcon icon={faEnvelope} />
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    className="form-control"
                                    placeholder="請輸入您的電子郵件地址"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label htmlFor="password">密碼</label>
                            <div className="input-with-icon">
                                <FontAwesomeIcon icon={faLock} />
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    className="form-control"
                                    placeholder="請輸入您的密碼"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-options">
                            <label className="remember-me">
                                <input type="checkbox" name="remember" /> 記住我
                            </label>
                            <a href="/forgot-password" className="forgot-password">忘記密碼？</a>
                        </div>
                        <button type="submit" className="login-btn" disabled={loading}>
                            {loading ? <span className="loading" /> : <span className="btn-text">登入</span>}
                            <FontAwesomeIcon icon={faSignInAlt} style={{ marginLeft: '8px' }} />
                        </button>
                    </form>
                </div>
                <div className="login-footer">
                    <p className="register-link">
                        還沒有帳號？ <a href="/register">立即註冊</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
