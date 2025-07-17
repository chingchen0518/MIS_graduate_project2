import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlobe } from '@fortawesome/free-solid-svg-icons';

const SigninHeader = () => (
    <div className="header">
        <div className="logo">
            <div className="logo-icon">
                <FontAwesomeIcon icon={faGlobe} />
            </div>
            <h1 className="title">Vistour</h1>
        </div>
        <p className="subtitle">註冊新帳號</p>
    </div>
);

export default SigninHeader;
