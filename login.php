<?php
session_start();

// 資料庫連接函數
function getDbConnection()
{
    $servername = "localhost";
    $username = "root";
    $password = "";
    $dbname = "Vistour";

    try {
        $db = new PDO("mysql:host=$servername;dbname=$dbname;charset=utf8mb4", $username, $password);
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $db;
    } catch (PDOException $e) {
        die("資料庫連線失敗: " . $e->getMessage());
    }
}

// 檢查是否已經登入
if (isset($_SESSION['UserID'])) {
    // 根據用戶角色決定重定向位置
    $role = strtolower($_SESSION['role'] ?? '');
    switch ($role) {
        case 'customer':
            header("Location: ../food-delivery1/homepage.php");
            break;
        case 'merchant':
            header("Location: ../merchant_panel/index.php");
            break;
        case 'delivery':
            header("Location: delivery-driver.php");
            break;
        default:
            // 如果角色不明確，根據 UserID 重新獲取
            if (isset($_SESSION['UserID'])) {
                $db = getDbConnection();
                $stmt = $db->prepare("SELECT Role FROM user WHERE UserID = ?");
                $stmt->execute([$_SESSION['UserID']]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);

                if ($user) {
                    $_SESSION['role'] = $user['Role'];
                    $role = strtolower($user['Role']);
                    switch ($role) {
                        case 'customer':
                            header("Location: ../food-delivery1/homepage.php");
                            break;
                        case 'merchant':
                            header("Location: ../merchant_panel/index.php");
                            break;
                        case 'delivery':
                            header("Location: delivery-driver.php");
                            break;
                        default:
                            header("Location: ../food-delivery1/homepage.php");
                    }
                } else {
                    // 用戶不存在，清除 session 並繼續登入流程
                    session_destroy();
                    session_start();
                }
            } else {
                header("Location: ../food-delivery1/homepage.php");
            }
    }
    if (!headers_sent()) {
        exit();
    }
}

// 處理登入提交
$loginError = "";
$successMessage = "";

// 檢查是否有註冊成功或密碼重設成功的訊息
if (isset($_SESSION['register_success'])) {
    $successMessage = "註冊成功！請使用您的帳號密碼登入";
    unset($_SESSION['register_success']);
}

if (isset($_SESSION['password_reset_success'])) {
    $successMessage = "密碼重設成功！請使用新密碼登入";
    unset($_SESSION['password_reset_success']);
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $email = filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL);
    $password = $_POST['password'];

    if (empty($email) || empty($password)) {
        $loginError = "請輸入電子郵件和密碼！";
    } else {
        $db = getDbConnection();

        // 從資料庫驗證使用者
        $sql = "SELECT UserID, Name, Email, Password, Role FROM user WHERE Email = ?";
        $stmt = $db->prepare($sql);
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        // 檢查使用者是否存在及密碼是否正確
        // 注意: 實際生產環境應使用 password_hash() 和 password_verify()
        if ($user && $password === $user['Password']) {
            // 登入成功，設置 session 變數
            $_SESSION['UserID'] = $user['UserID'];
            $_SESSION['userID'] = $user['UserID']; // 兼容性
            $_SESSION['name'] = $user['Name'];
            $_SESSION['username'] = $user['Name']; // 兼容性
            $_SESSION['email'] = $user['Email'];
            $_SESSION['role'] = $user['Role'];

            // 記錄登入信息
            error_log("用戶登入成功：ID={$user['UserID']}, Name={$user['Name']}, Role={$user['Role']}");

            // 檢查是否有重定向參數
            $redirect = $_GET['redirect'] ?? '';
            if (!empty($redirect) && filter_var($redirect, FILTER_VALIDATE_URL) === false) {
                // 如果是相對路徑，確保安全
                $redirect = basename($redirect);
            }

            // 根據角色重定向
            $role = strtolower($user['Role']);
            switch ($role) {
                case 'customer':
                    if (!empty($redirect) && strpos($redirect, 'food-delivery') !== false) {
                        header("Location: ../" . $redirect);
                    } else {
                        header("Location: ../food-delivery1/homepage.php");
                    }
                    break;
                case 'merchant':
                    header("Location: ../merchant_panel/index.php");
                    break;
                case 'delivery':
                    header("Location: delivery-driver.php");
                    break;
                default:
                    // 預設重定向到顧客首頁
                    header("Location: ../food-delivery1/homepage.php");
            }
            exit();
        } else {
            $loginError = "電子郵件或密碼錯誤！";
        }
    }
}
?>
<!DOCTYPE html>
<html lang="zh-TW">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vistour - 登入</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Nunito', sans-serif;
        }

        body {
            background: linear-gradient(135deg, #667eea 0%, #9cd0b5 25%, #003ea8 50%, #9cd0b5 75%, #3b82f6 100%);
            background-size: 400% 400%;
            animation: gradientBG 15s ease infinite;
            color: #333;
            font-size: 14px;
            line-height: 1.5;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
            position: relative;
        }

        @keyframes gradientBG {
            0% {
                background-position: 0% 50%;
            }

            25% {
                background-position: 100% 25%;
            }

            50% {
                background-position: 100% 100%;
            }

            75% {
                background-position: 0% 75%;
            }

            100% {
                background-position: 0% 50%;
            }
        }

        /* 浮動裝飾元素 */
        .floating-shapes {
            position: absolute;
            width: 100%;
            height: 100%;
            overflow: hidden;
            z-index: 1;
        }

        .shape {
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.1);
            animation: float 6s ease-in-out infinite;
        }

        .shape:nth-child(1) {
            width: 80px;
            height: 80px;
            top: 20%;
            left: 10%;
            animation-delay: 0s;
        }

        .shape:nth-child(2) {
            width: 60px;
            height: 60px;
            top: 60%;
            right: 15%;
            animation-delay: 2s;
        }

        .shape:nth-child(3) {
            width: 100px;
            height: 100px;
            bottom: 20%;
            left: 15%;
            animation-delay: 4s;
        }

        .shape:nth-child(4) {
            width: 40px;
            height: 40px;
            top: 30%;
            right: 25%;
            animation-delay: 1s;
        }

        @keyframes float {

            0%,
            100% {
                transform: translateY(0px) rotate(0deg);
            }

            50% {
                transform: translateY(-20px) rotate(180deg);
            }
        }

        .login-container {
            width: 100%;
            max-width: 420px;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border-radius: 20px;
            overflow: hidden;
            box-shadow:
                0 25px 50px rgba(0, 0, 0, 0.2),
                0 10px 20px rgba(0, 0, 0, 0.1),
                inset 0 1px 0 rgba(255, 255, 255, 0.1);
            animation: slideUp 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            position: relative;
            z-index: 2;
        }

        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(60px) scale(0.9);
            }

            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }

        .login-header {
            padding: 30px 35px;
            background: linear-gradient(135deg, #A1E3F9 0%, #578FCA 50%, #5078c1 100%);
            text-align: center;
            position: relative;
            overflow: hidden;
        }

        .login-header::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
            transform: rotate(45deg);
            animation: shimmer 3s linear infinite;
        }

        @keyframes shimmer {
            0% {
                transform: translateX(-100%) translateY(-100%) rotate(45deg);
            }

            100% {
                transform: translateX(100%) translateY(100%) rotate(45deg);
            }
        }

        .login-logo {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 15px;
            position: relative;
            z-index: 1;
        }

        .login-logo-icon {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            margin-right: 15px;
            background: white;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
            animation: logoSpin 2s ease-in-out infinite alternate;
        }

        @keyframes logoSpin {
            0% {
                transform: rotate(0deg) scale(1);
            }

            100% {
                transform: rotate(5deg) scale(1.05);
            }
        }

        .login-title {
            font-size: 32px;
            font-weight: 700;
            color: white;
            margin-bottom: 5px;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            position: relative;
            z-index: 1;
        }

        .login-subtitle {
            color: rgba(255, 255, 255, 0.9);
            font-size: 16px;
            font-weight: 400;
            position: relative;
            z-index: 1;
        }

        .login-body {
            padding: 40px 35px 30px;
        }

        .role-info {
            background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 25px;
            border-left: 4px solid #3b82f6;
            animation: slideInFromLeft 0.6s ease-out 0.3s both;
        }

        @keyframes slideInFromLeft {
            from {
                opacity: 0;
                transform: translateX(-30px);
            }

            to {
                opacity: 1;
                transform: translateX(0);
            }
        }

        .role-info h4 {
            color: #1d4ed8;
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
        }

        .role-info h4 i {
            margin-right: 8px;
        }

        .role-info p {
            color: #1e40af;
            font-size: 13px;
            line-height: 1.5;
        }

        .form-group {
            margin-bottom: 25px;
            animation: slideInFromRight 0.6s ease-out both;
        }

        .form-group:nth-child(2) {
            animation-delay: 0.1s;
        }

        .form-group:nth-child(3) {
            animation-delay: 0.2s;
        }

        .form-group:nth-child(4) {
            animation-delay: 0.3s;
        }

        @keyframes slideInFromRight {
            from {
                opacity: 0;
                transform: translateX(30px);
            }

            to {
                opacity: 1;
                transform: translateX(0);
            }
        }

        .form-group label {
            display: block;
            margin-bottom: 10px;
            font-weight: 600;
            color: #374151;
            font-size: 15px;
        }

        .input-with-icon {
            position: relative;
        }

        .input-with-icon i {
            position: absolute;
            left: 18px;
            top: 50%;
            transform: translateY(-50%);
            color: #003ea8;
            font-size: 18px;
            transition: all 0.3s ease;
        }

        .form-control {
            width: 100%;
            padding: 18px 20px 18px 55px;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            font-size: 15px;
            transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            background: #fafafa;
            font-weight: 500;
        }

        .form-control:focus {
            outline: none;
            border-color: #003ea8;
            background: white;
            box-shadow:
                0 0 0 4px rgba(16, 19, 185, 0.1),
                0 4px 12px rgba(16, 50, 185, 0.15);
            transform: translateY(-1px);
        }

        .form-control:focus+.input-with-icon i {
            color: #059669;
            transform: translateY(-50%) scale(1.1);
        }

        .form-options {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            animation: fadeInUp 0.6s ease-out 0.4s both;
        }

        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }

            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .remember-me {
            display: flex;
            align-items: center;
            gap: 10px;
            color: #6b7280;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: color 0.3s ease;
        }

        .remember-me:hover {
            color: #003ea8;
        }

        .remember-me input {
            margin: 0;
            accent-color: #003ea8;
            transform: scale(1.1);
        }

        .forgot-password {
            color: #003ea8;
            font-size: 14px;
            text-decoration: none;
            font-weight: 600;
            transition: all 0.3s ease;
            position: relative;
        }

        .forgot-password::after {
            content: '';
            position: absolute;
            width: 0;
            height: 2px;
            bottom: -2px;
            left: 0;
            background-color: #003ea8;
            transition: width 0.3s ease;
        }

        .forgot-password:hover::after {
            width: 100%;
        }

        .login-btn {
            width: 100%;
            padding: 18px;
            background: linear-gradient(135deg, #A1E3F9 0%, #578FCA 50%, #5078c1 100%);
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            box-shadow:
                0 8px 20px rgb(16 46 185 / 30%),
                0 4px 8px rgba(16, 75, 185, 0.2);
            position: relative;
            overflow: hidden;
            animation: fadeInUp 0.6s ease-out 0.5s both;
        }

        .login-btn::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
            transition: left 0.5s;
        }

        .login-btn:hover::before {
            left: 100%;
        }

        .login-btn:hover {
            transform: translateY(-3px);
            box-shadow:
                0 12px 30px rgba(16, 75, 185, 0.4);
                0 8px 16px rgba(16, 75, 185, 0.2);
        }

        .login-btn:active {
            transform: translateY(-1px);
            transition: transform 0.1s;
        }

        .login-footer {
            padding: 25px 35px;
            border-top: 1px solid #f0f0f0;
            text-align: center;
            background: #fafafa;
            animation: fadeIn 0.6s ease-out 0.6s both;
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
            }

            to {
                opacity: 1;
            }
        }

        .register-link {
            color: #6b7280;
            font-size: 15px;
            font-weight: 500;
        }

        .register-link a {
            color: #003ea8;
            font-weight: 700;
            text-decoration: none;
            transition: all 0.3s ease;
            position: relative;
        }

        .register-link a::after {
            content: '';
            position: absolute;
            width: 0;
            height: 2px;
            bottom: -2px;
            left: 0;
            background: linear-gradient(90deg, #003ea8, #059669);
            transition: width 0.3s ease;
        }

        .register-link a:hover::after {
            width: 100%;
        }

        .message {
            padding: 16px 20px;
            border-radius: 12px;
            margin-bottom: 25px;
            display: flex;
            align-items: center;
            gap: 12px;
            font-weight: 500;
            animation: messageSlide 0.5s ease-out;
        }

        @keyframes messageSlide {
            from {
                opacity: 0;
                transform: translateY(-20px) scale(0.95);
            }

            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }

        .message.error {
            background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
            color: #dc2626;
            border-left: 4px solid #dc2626;
            animation: shake 0.5s ease-in-out;
        }

        @keyframes shake {

            0%,
            100% {
                transform: translateX(0);
            }

            25% {
                transform: translateX(-5px);
            }

            75% {
                transform: translateX(5px);
            }
        }

        .message.success {
            background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
            color: #065f46;
            border-left: 4px solid #003ea8;
            animation: bounce 0.6s ease-out;
        }

        @keyframes bounce {

            0%,
            20%,
            50%,
            80%,
            100% {
                transform: translateY(0);
            }

            40% {
                transform: translateY(-5px);
            }

            60% {
                transform: translateY(-3px);
            }
        }

        .message i {
            font-size: 20px;
            animation: iconPulse 2s ease-in-out infinite;
        }

        @keyframes iconPulse {

            0%,
            100% {
                transform: scale(1);
            }

            50% {
                transform: scale(1.1);
            }
        }

        .social-login {
            margin-top: 30px;
            text-align: center;
            animation: fadeIn 0.6s ease-out 0.7s both;
        }

        .social-login-label {
            position: relative;
            color: #9ca3af;
            font-size: 14px;
            margin-bottom: 20px;
            font-weight: 500;
        }

        .social-login-label::before,
        .social-login-label::after {
            content: "";
            position: absolute;
            top: 50%;
            width: 35%;
            height: 1px;
            background: linear-gradient(90deg, transparent, #e5e7eb, transparent);
        }

        .social-login-label::before {
            left: 0;
        }

        .social-login-label::after {
            right: 0;
        }

        .social-buttons {
            display: flex;
            justify-content: center;
            gap: 20px;
        }

        .social-btn {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 20px;
            transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            position: relative;
            overflow: hidden;
        }

        .social-btn::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.3);
            transition: all 0.4s ease;
            transform: translate(-50%, -50%);
        }

        .social-btn:hover::before {
            width: 100%;
            height: 100%;
        }

        .social-btn:hover {
            transform: translateY(-8px) scale(1.1);
            box-shadow: 0 12px 25px rgba(0, 0, 0, 0.2);
        }

        .social-btn.facebook {
            background: linear-gradient(135deg, #4267B2 0%, #365899 100%);
            color: white;
        }

        .social-btn.google {
            background: linear-gradient(135deg, #DB4437 0%, #C23321 100%);
            color: white;
        }

        .social-btn.apple {
            background: linear-gradient(135deg, #000 0%, #333 100%);
            color: white;
        }

        /* 響應式設計 */
        @media (max-width: 480px) {
            body {
                padding: 10px;
            }

            .login-container {
                max-width: 100%;
                border-radius: 16px;
                margin: 0;
            }

            .login-header {
                padding: 25px 20px;
            }

            .login-body {
                padding: 30px 20px 25px;
            }

            .login-footer {
                padding: 20px;
            }

            .form-options {
                flex-direction: column;
                align-items: flex-start;
                gap: 15px;
            }

            .social-login-label::before,
            .social-login-label::after {
                width: 30%;
            }

            .social-buttons {
                gap: 15px;
            }

            .social-btn {
                width: 45px;
                height: 45px;
                font-size: 18px;
            }

            .floating-shapes {
                display: none;
            }
        }

        /* 載入動畫 */
        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top-color: #fff;
            animation: spin 1s ease-in-out infinite;
        }

        @keyframes spin {
            to {
                transform: rotate(360deg);
            }
        }
    </style>
</head>

<body>
    <!-- 浮動裝飾元素 -->
    <div class="floating-shapes">
        <div class="shape"></div>
        <div class="shape"></div>
        <div class="shape"></div>
        <div class="shape"></div>
    </div>

    <div class="login-container">
        <div class="login-header">
            <div class="login-logo">
                <div class="login-logo-icon">
                    <i class="fas fa-globe" style="color: #003ea8; font-size: 28px;"></i>
                </div>
                <h1 class="login-title">Vistour</h1>
            </div>
            <p class="login-subtitle">你的旅遊好幫手</p>
        </div>

        <div class="login-body">
            <!-- 成功訊息 -->
            <?php if (!empty($successMessage)): ?>
                <div class="message success">
                    <i class="fas fa-check-circle"></i>
                    <span><?php echo htmlspecialchars($successMessage); ?></span>
                </div>
            <?php endif; ?>

            <!-- 錯誤訊息 -->
            <?php if (!empty($loginError)): ?>
                <div class="message error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span><?php echo htmlspecialchars($loginError); ?></span>
                </div>
            <?php endif; ?>

            <form method="POST"
                action="<?php echo htmlspecialchars($_SERVER["PHP_SELF"]) . (isset($_GET['redirect']) ? '?redirect=' . htmlspecialchars($_GET['redirect']) : ''); ?>"
                id="loginForm">
                <div class="form-group">
                    <label for="email">電子郵件</label>
                    <div class="input-with-icon">
                        <i class="fas fa-envelope"></i>
                        <input type="email" id="email" name="email" class="form-control" placeholder="請輸入您的電子郵件地址"
                            required
                            value="<?php echo isset($_POST['email']) ? htmlspecialchars($_POST['email']) : ''; ?>">
                    </div>
                </div>

                <div class="form-group">
                    <label for="password">密碼</label>
                    <div class="input-with-icon">
                        <i class="fas fa-lock"></i>
                        <input type="password" id="password" name="password" class="form-control" placeholder="請輸入您的密碼"
                            required>
                    </div>
                </div>

                <div class="form-options">
                    <label class="remember-me">
                        <input type="checkbox" name="remember"> 記住我
                    </label>
                    <a href="forgot-password.php" class="forgot-password">忘記密碼？</a>
                </div>

                <button type="submit" class="login-btn" id="loginBtn">
                    <span class="btn-text">登入</span>
                    <i class="fas fa-sign-in-alt" style="margin-left: 8px;"></i>
                </button>

            </form>
        </div>

        <div class="login-footer">
            <p class="register-link">還沒有帳號？ <a href="register.php">立即註冊</a></p>
        </div>
    </div>

    <script>
        // 表單驗證和提交動畫
        document.getElementById('loginForm').addEventListener('submit', function (e) {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const loginBtn = document.getElementById('loginBtn');

            if (!email || !password) {
                e.preventDefault();
                showNotification('請填寫完整的登入資訊', 'error');
                return;
            }

            // 簡單的電子郵件格式驗證
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                e.preventDefault();
                showNotification('請輸入有效的電子郵件格式', 'error');
                return;
            }

            // 顯示載入動畫
            loginBtn.innerHTML = '<span class="loading"></span> 登入中...';
            loginBtn.disabled = true;
        });

        // 自動聚焦到第一個輸入框
        document.addEventListener('DOMContentLoaded', function () {
            document.getElementById('email').focus();

            // 輸入框動畫效果
            const inputs = document.querySelectorAll('.form-control');
            inputs.forEach(input => {
                input.addEventListener('focus', function () {
                    this.parentElement.style.transform = 'scale(1.02)';
                });

                input.addEventListener('blur', function () {
                    this.parentElement.style.transform = 'scale(1)';
                });
            });
        });

        // 通知函數
        function showNotification(message, type) {
            // 移除現有通知
            const existingNotification = document.querySelector('.notification');
            if (existingNotification) {
                existingNotification.remove();
            }

            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${type === 'error' ? 'linear-gradient(135deg, #fee2e2, #fecaca)' : 'linear-gradient(135deg, #d1fae5, #a7f3d0)'};
                color: ${type === 'error' ? '#dc2626' : '#065f46'};
                padding: 16px 20px;
                border-radius: 12px;
                box-shadow: 0 8px 25px rgba(0,0,0,0.15);
                z-index: 9999;
                animation: slideInNotification 0.5s ease-out;
                border-left: 4px solid ${type === 'error' ? '#dc2626' : '#003ea8'};
                font-weight: 500;
                max-width: 300px;
            `;

            notification.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-${type === 'error' ? 'exclamation-triangle' : 'check-circle'}" style="font-size: 18px;"></i>
                    <span>${message}</span>
                </div>
            `;

            document.body.appendChild(notification);

            // 3秒後自動移除
            setTimeout(() => {
                notification.style.animation = 'slideOutNotification 0.5s ease-in forwards';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 500);
            }, 3000);
        }

        // 添加通知動畫 CSS
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInNotification {
                from {
                    opacity: 0;
                    transform: translateX(100%);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            
            @keyframes slideOutNotification {
                from {
                    opacity: 1;
                    transform: translateX(0);
                }
                to {
                    opacity: 0;
                    transform: translateX(100%);
                }
            }
        `;
        document.head.appendChild(style);

        // 社交媒體按鈕點擊效果
        document.querySelectorAll('.social-btn').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.preventDefault();

                // 創建漣漪效果
                const ripple = document.createElement('span');
                ripple.style.cssText = `
                    position: absolute;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.6);
                    transform: scale(0);
                    animation: ripple 0.6s linear;
                    width: 40px;
                    height: 40px;
                    left: 50%;
                    top: 50%;
                    margin-left: -20px;
                    margin-top: -20px;
                `;

                this.appendChild(ripple);

                setTimeout(() => {
                    ripple.remove();
                }, 600);

                showNotification('社交媒體登入功能開發中...', 'info');
            });
        });

        // 添加漣漪動畫
        const rippleStyle = document.createElement('style');
        rippleStyle.textContent = `
            @keyframes ripple {
                to {
                    transform: scale(2);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(rippleStyle);
    </script>
</body>

</html>