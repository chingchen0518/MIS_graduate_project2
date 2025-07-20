import React, { useState } from 'react';
import './forgotpassword.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock, faGlobe, faCheckCircle, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom'; // ✅ 這行你可能已經有了

const ForgotPassword = () => {
    const navigate = useNavigate(); // ✅ 少了這行！
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1 = 輸入信箱, 2 = 輸入新密碼

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (step === 1) {
            // 檢查 Email 格式
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!email) {
                setError('請輸入電子郵件！');
                return;
            }
            if (!emailRegex.test(email)) {
                setError('請輸入有效的電子郵件格式');
                return;
            }

            // 模擬成功進入第二步
            setSuccess('驗證成功');
            setTimeout(() => {
                setStep(2);
                setSuccess('');
            }, 500);
        } else if (step === 2) {
            // 檢查密碼
            if (!newPassword || !confirmPassword) {
                setError('請輸入並確認新密碼');
                return;
            }
            if (newPassword !== confirmPassword) {
                setError('兩次輸入的密碼不一致');
                return;
            }
            if (newPassword.length < 6) {
                setError('密碼必須至少6個字符');
                return;
            }

            // 模擬密碼重設成功
            setSuccess('密碼已成功重設！您可以回去登入囉～');
            setTimeout(() => {
                navigate('/Login');
            }, 1000);
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
                    <p className="subtitle">你的旅遊好幫手</p>
                </div>
                <div className="body">
                    {success && (
                        <div className="message success" role="alert">
                            <FontAwesomeIcon icon={faCheckCircle} />
                            <span>{success}</span>
                        </div>
                    )}
                    {error && (
                        <div className="message error" role="alert">
                            <FontAwesomeIcon icon={faExclamationTriangle} />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate>
                        {step === 1 ? (
                            <>
                                <div className="form-group">
                                    <label htmlFor="email">電子郵件</label>
                                    <div className="input-with-icon">
                                        <FontAwesomeIcon icon={faEnvelope} />
                                        <input
                                            type="email"
                                            id="email"
                                            className="form-control"
                                            placeholder="請輸入您的電子郵件地址"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value.trim())}
                                            required
                                        />
                                    </div>
                                </div>
                                <p className="forget_text">
                                    我們將向您發送密碼重設說明。<br />
                                    如果您記不住註冊時使用的電子郵件，<br />
                                    請聯繫客服。
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="form-group">
                                    <label htmlFor="newPassword">新密碼</label>
                                    <div className="input-with-icon">
                                        <FontAwesomeIcon icon={faLock} />
                                        <input
                                            type="password"
                                            id="newPassword"
                                            className="form-control"
                                            placeholder="請輸入新密碼"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
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
                                            className="form-control"
                                            placeholder="請再次輸入新密碼"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                        <button
                            type="submit"
                            className="btn"
                            disabled={loading}
                        >
                            {loading ? '處理中...' : step === 1 ? '請求重設密碼' : '提交新密碼'}
                        </button>
                    </form>
                </div>
                <div className="footer">
                    記得密碼？ <a href="/Login">立即登入</a>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
