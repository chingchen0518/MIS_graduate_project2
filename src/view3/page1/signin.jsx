import React, { useState } from "react";
import './signin.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlobe, faEnvelope, faUser, faLock, faAddressCard } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';

let BASE_URL = import.meta.env.VITE_API_URL;
const PORT = import.meta.env.PORT || 3001;
if (BASE_URL && !BASE_URL.startsWith('http')) {
    BASE_URL = `http://${BASE_URL}`;
}
if (PORT) {
    BASE_URL = `${BASE_URL}:${PORT}`;
}

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
    const navigate = useNavigate();
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const invite = params.get('invite');

    const handleChange = (e) => {
        const { name, type, files, value } = e.target;
        if (type === 'file') {
            setForm((prev) => ({ ...prev, [name]: files[0] }));
        } else {
            setForm((prev) => ({ ...prev, [name]: value }));
        }
    };

    const validate = () => {
        const errs = [];
        if (!form.name.trim()) errs.push("Name cannot be empty");
        if (!form.email.trim()) errs.push("Email cannot be empty");
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.push("Please enter a valid email address");
        if (!form.password) errs.push("Password cannot be empty");
        else if (form.password.length < 6) errs.push("Password must be at least 6 characters");
        if (form.password !== form.confirmPassword) errs.push("Passwords do not match");
        return errs;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        setErrors(errs);
        if (errs.length === 0) {
            try {
                const formData = new FormData();
                formData.append('name', form.name);
                formData.append('email', form.email);
                formData.append('account', form.account);
                formData.append('password', form.password);
                if (form.avatar) formData.append('avatar', form.avatar);
                if (invite) formData.append('invite', invite);

                const response = await fetch(`${BASE_URL}/api/view3_signin`, {
                    method: 'POST',
                    body: formData,
                });

                const data = await response.json();

                if (response.ok) {
                    localStorage.setItem('user', JSON.stringify(data.user));
                    // 如果有 tid，更新 local 的 trip 資料
                    if (data.user.tid) {
                        localStorage.setItem('trip', JSON.stringify({
                            t_id: data.user.tid,
                            title: data.user.title || ''
                        }));
                    }
                    setForm(initialState);
                    setErrors([]);
                    setTimeout(() => {
                        navigate('/Vistour');
                    }, 500);
                } else {
                    setErrors([data?.message || `Registration failed (Status Code: ${response.status})`]);
                }
            } catch (err) {
                setErrors([`An error occurred, please ensure the server is running. Error message: ${err.message}`]);
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
                    <p className="all_subtitle">Register a new account</p>
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

                    <form onSubmit={handleSubmit} encType="multipart/form-data" method="POST">
                        <div className="all_form-group">
                            <label htmlFor="name">Name</label>
                            <div className="all_input-with-icon">
                                <FontAwesomeIcon icon={faUser} />
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    className="form-control"
                                    placeholder="Please enter your name"
                                    value={form.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="all_form-group">
                            <label htmlFor="email">Email</label>
                            <div className="all_input-with-icon">
                                <FontAwesomeIcon icon={faEnvelope} />
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    className="form-control"
                                    placeholder="Please enter your email"
                                    value={form.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>
                        <div className="all_form-group">
                            <label htmlFor="account">Account</label>
                            <div className="all_input-with-icon">
                                <FontAwesomeIcon icon={faAddressCard} />
                                <input
                                    type="text"
                                    id="account"
                                    name="account"
                                    className="form-control"
                                    placeholder="Please enter your account"
                                    value={form.account}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-row">
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
                                        value={form.password}
                                        onChange={handleChange}
                                        required
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
                                        name="confirmPassword"
                                        className="form-control"
                                        placeholder="Please re-enter your password"
                                        value={form.confirmPassword}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="all_form-group">
                            <label htmlFor="avatar">Add Avatar</label>
                            <div className="all_input-with-icon">
                                <FontAwesomeIcon icon={faAddressCard} />
                                <input
                                    type="file"
                                    id="avatar"
                                    name="avatar"
                                    accept="image/*"
                                    className="form-control"
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <button type="submit" className="all_btn">Register</button>
                    </form>
                </div>

                <div className="all_footer">
                    <p className="login-link">
                        Already have an account? <a href="/Login">Log in now</a>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Signin;