// login.jsx
import React, { useState } from 'react';
import './login.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock, faSignInAlt, faGlobe, faCheckCircle, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';

let HOST_URL = import.meta.env.VITE_API_URL;
let NGROK_URL = import.meta.env.VITE_NGROK_URL;

const PORT = import.meta.env.PORT || 3001;

let BASE_URL = NGROK_URL || `http://${HOST_URL}:${PORT}`;

// // 如果 BASE_URL 沒有 http 開頭，補上
// if (BASE_URL && !BASE_URL.startsWith('http')) {
//   BASE_URL = `http://${BASE_URL}`;
// }
// // 如果 PORT 存在且 BASE_URL 沒有冒號，補上 :PORT
// if (PORT) {
//   BASE_URL = `${BASE_URL}`;
// }

const Login = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const [account, setaccount] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!account || !password) {
            setError('Please enter your account and password!');
            return;
        }

        setLoading(true);

        try {
            let api = `${BASE_URL}/api/view3_login`;
            const res = await fetch(api, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'ngrok-skip-browser-warning': 'true'
                    },
                    body: JSON.stringify({ account, password }),
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess(data.message || 'Login successful!');

                if (data.user) {
                    localStorage.setItem('user', JSON.stringify(data.user));
                }

                // 使用 React Router 導頁
                setTimeout(() => {
                    navigate(data.redirect || '/profile');
                }, 1500);
            } else {
                setError(data.message || 'Login failed!');
            }
        } catch (err) {
            setError('An error occurred, please try again later');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="all_page">
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
                    <p className="all_subtitle">Your travel assistant</p>
                </div>
                <div className="body">
                    {success && (
                        <div className="message success" role="alert" aria-live="assertive">
                            <FontAwesomeIcon icon={faCheckCircle} />
                            <span>{success}</span>
                        </div>
                    )}
                    {error && (
                        <div className="message error" role="alert" aria-live="assertive">
                            <FontAwesomeIcon icon={faExclamationTriangle} />
                            <span>{error}</span>
                        </div>
                    )}
                    <form onSubmit={handleSubmit} noValidate>
                        <div className="all_form-group">
                            <label htmlFor="account">Account</label>
                            <div className="all_input-with-icon">
                                <FontAwesomeIcon icon={faEnvelope} />
                                <input
                                    id="account"
                                    type="text"
                                    className="form-control"
                                    placeholder="Please enter your account"
                                    value={account}
                                    onChange={(e) => setaccount(e.target.value.trim())}
                                    required
                                    autoComplete="account"
                                    aria-describedby="accountHelp"
                                />
                            </div>
                        </div>
                        <div className="all_form-group">
                            <label htmlFor="password">Password</label>
                            <div className="all_input-with-icon">
                                <FontAwesomeIcon icon={faLock} />
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    className="form-control"
                                    placeholder="Please enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoComplete="current-password"
                                />
                            </div>
                        </div>
                        <div className="form-options">
                            <a href="/forgotpassword" className="forgotpassword">
                                Forgot password?
                            </a>
                        </div>
                        <button
                            type="submit"
                            className="all_btn"
                            disabled={loading}
                            aria-busy={loading}
                            aria-disabled={loading}
                        >
                            {loading ? (
                                <span className="loading" aria-label="Loading" />
                            ) : (
                                <>
                                    <span className="all_btn-text">Login</span>
                                    <FontAwesomeIcon icon={faSignInAlt} style={{ marginLeft: '8px' }} />
                                </>
                            )}
                        </button>
                    </form>
                </div>
                <div className="all_footer">
                    <p className="register-link">
                        Don't have an account? <a href="/Signin">Sign up now</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
