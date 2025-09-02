// forgotpassword.jsx
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (step === 1) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!email) {
                setError('Please enter your email!');
                return;
            }
            if (!emailRegex.test(email)) {
                setError('Please enter a valid email address');
                return;
            }

            try {
                setLoading(true);
                const response = await fetch('/api/view3_forgot_password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email }),
                });

                const data = await response.json();
                setLoading(false);

                if (response.ok) {
                    setSuccess(data.message || 'Verification successful');
                    setTimeout(() => {
                        setStep(2);
                        setSuccess('');
                    }, 500);
                } else {
                    setError(data.message || 'Unable to verify email');
                }
            } catch (err) {
                setLoading(false);
                setError('Server error, please try again later');
            }
        } else if (step === 2) {
            if (!newPassword || !confirmPassword) {
                setError('Please enter and confirm your new password');
                return;
            }
            if (newPassword !== confirmPassword) {
                setError('Passwords do not match');
                return;
            }
            if (newPassword.length < 6) {
                setError('Password must be at least 6 characters');
                return;
            }

            try {
                setLoading(true);
                const response = await fetch('/api/view3_reset_password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email,
                        password: newPassword,
                    }),
                });

                const data = await response.json();
                setLoading(false);

                if (response.ok) {
                    setSuccess(data.message || 'Password reset successful! You can log in now.');
                    setTimeout(() => {
                        navigate('/Login');
                    }, 1000);
                } else {
                    setError(data.message || 'Password reset failed');
                }
            } catch (err) {
                setLoading(false);
                setError('Server error, please try again later');
            }
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
                                <div className="all_form-group">
                                    <label htmlFor="email">Email</label>
                                    <div className="all_input-with-icon">
                                        <FontAwesomeIcon icon={faEnvelope} />
                                        <input
                                            type="email"
                                            id="email"
                                            className="form-control"
                                            placeholder="Please enter your email address"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value.trim())}
                                            required
                                        />
                                    </div>
                                </div>
                                <p className="forget_text">
                                    We will send you instructions to reset your password.<br />
                                    If you don't remember the email you registered with,<br />
                                    please contact customer service.
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="all_form-group">
                                    <label htmlFor="newPassword">New Password</label>
                                    <div className="all_input-with-icon">
                                        <FontAwesomeIcon icon={faLock} />
                                        <input
                                            type="password"
                                            id="newPassword"
                                            className="form-control"
                                            placeholder="Please enter your new password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                            autoComplete="new-password"
                                        />
                                    </div>
                                </div>
                                <div className="all_form-group">
                                    <label htmlFor="confirmPassword">Confirm Password</label>
                                    <div className="all_input-with-icon">
                                        <FontAwesomeIcon icon={faLock} />
                                        <input
                                            type="password"
                                            id="confirmPassword"
                                            className="form-control"
                                            placeholder="Please confirm your new password"
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
                            className="all_btn"
                            disabled={loading}
                        >
                            {loading ? 'Processing...' : step === 1 ? 'Request Password Reset' : 'Submit New Password'}
                        </button>
                    </form>
                </div>
                <div className="all_footer">
                    Remember your password? <a href="/Login">Log in now</a>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
