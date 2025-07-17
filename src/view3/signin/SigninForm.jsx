import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faUser, faLock } from '@fortawesome/free-solid-svg-icons';

const SigninForm = ({ form, handleChange, handleSubmit }) => (
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
);

export default SigninForm;
