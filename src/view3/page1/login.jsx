/* login.css */
body {
    margin: 0;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg, #f5f9ff, #dcecff);
}

.login-page {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
    position: relative;
    overflow: hidden;
}

.floating-shapes .shape {
    position: absolute;
    width: 120px;
    height: 120px;
    background-color: #aedbff;
    border-radius: 50%;
    opacity: 0.3;
    animation: float 8s ease-in-out infinite;
}

.floating-shapes .shape:nth-child(1) {
    top: 10%;
    left: 20%;
    animation-delay: 0s;
}

.floating-shapes .shape:nth-child(2) {
    top: 30%;
    right: 15%;
    animation-delay: 2s;
}

.floating-shapes .shape:nth-child(3) {
    bottom: 20%;
    left: 25%;
    animation-delay: 4s;
}

.floating-shapes .shape:nth-child(4) {
    bottom: 10%;
    right: 10%;
    animation-delay: 6s;
}

@keyframes float {

    0%,
    100% {
        transform: translateY(0);
    }

    50% {
        transform: translateY(-20px);
    }
}

.login-container {
    background-color: #fff;
    padding: 40px;
    border-radius: 20px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 420px;
    z-index: 10;
}

.login-header {
    text-align: center;
    margin-bottom: 20px;
}

.login-logo {
    display: flex;
    align-items: center;
    justify-content: center;
}

.login-logo-icon {
    font-size: 32px;
    margin-right: 10px;
    color: #3b82f6;
}

.login-title {
    font-size: 28px;
    font-weight: 700;
    color: #333;
}

.login-subtitle {
    font-size: 14px;
    color: #777;
    margin-top: 4px;
}

.login-body .form-group {
    margin-bottom: 20px;
}

.input-with-icon {
    display: flex;
    align-items: center;
    background-color: #f0f4f8;
    border-radius: 10px;
    padding: 10px;
}

.input-with-icon input {
    border: none;
    outline: none;
    background: none;
    flex: 1;
    font-size: 16px;
    padding-left: 10px;
}

.input-with-icon svg {
    color: #3b82f6;
}

.form-options {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
    margin-bottom: 20px;
}

.forgot-password {
    color: #3b82f6;
    text-decoration: none;
}

.forgot-password:hover {
    text-decoration: underline;
}

.login-btn {
    width: 100%;
    background-color: #3b82f6;
    color: white;
    padding: 12px 20px;
    font-size: 16px;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: background-color 0.3s ease;
}

.login-btn:hover {
    background-color: #2563eb;
}

.login-btn:disabled {
    background-color: #93c5fd;
    cursor: not-allowed;
}

.loading {
    width: 20px;
    height: 20px;
    border: 3px solid #fff;
    border-top: 3px solid transparent;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.message {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px;
    margin-bottom: 16px;
    border-radius: 8px;
    font-size: 14px;
}

.message.success {
    background-color: #e0fce5;
    color: #15803d;
}

.message.error {
    background-color: #fee2e2;
    color: #b91c1c;
}

.login-footer {
    text-align: center;
    margin-top: 20px;
}

.register-link a {
    color: #3b82f6;
    text-decoration: none;
}

.register-link a:hover {
    text-decoration: underline;
}