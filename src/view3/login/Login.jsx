import React, { useState } from 'react';
import './login.css';
import FloatingShapes from './FloatingShapes';
import LoginHeader from './LoginHeader';
import LoginForm from './LoginForm';
import LoginFooter from './LoginFooter';
import LoginMessage from './LoginMessage';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    return (
        <div className="page">
            <FloatingShapes />
            <div className="container">
                <LoginHeader />
                <div className="body">
                    <LoginMessage error={error} success={success} />
                    <LoginForm
                        email={email}
                        setEmail={setEmail}
                        password={password}
                        setPassword={setPassword}
                        setError={setError}
                        setSuccess={setSuccess}
                        setLoading={setLoading}
                        loading={loading}
                    />
                </div>
                <LoginFooter />
            </div>
        </div>
    );
};

export default Login;
