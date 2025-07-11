<?php
session_start();
require_once 'db_connection.php';

// 檢查是否已經登入
if (isset($_SESSION['UserID'])) {
    header("Location: delivery-driver.php");
    exit();
}

// 初始化表單字段和錯誤信息
$name = $email = $password = $confirmPassword = $phone = $address = $role = $healthGoal = '';
$errors = [];

// 處理表單提交
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // 獲取並清理表單數據
    $name = sanitizeInput($_POST['name'] ?? '');
    $email = filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL);
    $password = $_POST['password'] ?? '';
    $confirmPassword = $_POST['confirm_password'] ?? '';
    $phone = sanitizeInput($_POST['phone'] ?? '');
    $address = sanitizeInput($_POST['address'] ?? '');
    $role = sanitizeInput($_POST['role'] ?? 'delivery'); // 默認為外送員
    $healthGoal = sanitizeInput($_POST['health_goal'] ?? '');

    // 驗證姓名
    if (empty($name)) {
        $errors[] = "姓名不能為空";
    }

    // 驗證電子郵件
    if (empty($email)) {
        $errors[] = "電子郵件不能為空";
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors[] = "請輸入有效的電子郵件地址";
    } else {
        // 檢查電子郵件是否已存在
        $checkEmail = dbFetchRow("SELECT Email FROM user WHERE Email = ?", [$email], "s");
        if ($checkEmail) {
            $errors[] = "此電子郵件已被註冊";
        }
    }

    // 驗證密碼
    if (empty($password)) {
        $errors[] = "密碼不能為空";
    } elseif (strlen($password) < 6) {
        $errors[] = "密碼必須至少6個字符";
    }

    // 確認密碼
    if ($password !== $confirmPassword) {
        $errors[] = "兩次輸入的密碼不一致";
    }

    // 如果沒有錯誤，則插入用戶數據
    if (empty($errors)) {
        // 注意：實際生產環境應使用 password_hash()
        $sql = "INSERT INTO user (Name, Email, Password, Phone, Address, Role, HealthGoal) VALUES (?, ?, ?, ?, ?, ?, ?)";
        $userId = dbInsert($sql, [$name, $email, $password, $phone, $address, $role, $healthGoal], "sssssss");

        if ($userId) {
            // 如果是外送員註冊，創建對應的driver記錄
            if ($role === 'delivery') {
                $driverSql = "INSERT INTO driver (UserID, VehicleType, OnlineStatus, AccountStatus, JoinDate) 
                             VALUES (?, 'scooter', 'offline', 'active', NOW())";
                dbInsert($driverSql, [$userId], "i");
            }

            // 註冊成功，重定向到登入頁面
            $_SESSION['register_success'] = true;
            header("Location: login.php");
            exit();
        } else {
            $errors[] = "註冊失敗，請稍後再試";
        }
    }
}
?>
<!DOCTYPE html>
<html lang="zh-TW">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vistour - 註冊</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Nunito', 'Segoe UI', Arial, sans-serif;
        }

        body {
            background: linear-gradient(135deg, #667eea 0%, #9cd0b5 25%, #003ea8 50%, #9cd0b5 75%, #3b82f6 100%);
            background-size: 400% 400%;
            animation: gradientBG 15s ease infinite;
            font-size: 14px;
            line-height: 1.5;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
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

        .register-container {
            width: 100%;
            max-width: 500px;
            background-color: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
        }

        .register-header {
            padding: 25px 30px;
            background: linear-gradient(135deg, #A1E3F9 0%, #578FCA 50%, #5078c1 100%);
            text-align: center;
        }

        .register-logo {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 15px;
        }

        .register-logo-icon {
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

        .register-title {
            font-size: 32px;
            font-weight: 700;
            color: white;
            margin-bottom: 5px;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            position: relative;
            z-index: 1;
        }

        .register-subtitle {
            color: rgba(255, 255, 255, 0.9);
            font-size: 16px;
            font-weight: 400;
            position: relative;
            z-index: 1;
        }

        .register-body {
            padding: 30px;
        }

        .form-group {
            margin-bottom: 20px;
        }

        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #555;
        }

        .input-with-icon {
            position: relative;
        }

        .input-with-icon i {
            position: absolute;
            left: 12px;
            top: 50%;
            transform: translateY(-50%);
            color: #999;
        }

        .form-control {
            width: 100%;
            padding: 12px 15px 12px 40px;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            font-size: 14px;
            transition: border-color 0.3s ease;
            background-color: #f8f8f8;
        }

        .form-control:focus {
            outline: none;
            border-color: #003ea8;
            background-color: white;
        }

        .form-row {
            display: flex;
            gap: 20px;
        }

        .form-row .form-group {
            flex: 1;
        }

        .register-btn {
            width: 100%;
            padding: 12px;
            background: linear-gradient(135deg, #A1E3F9 0%, #578FCA 50%, #5078c1 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 6px rgba(239, 68, 68, 0.2);
            margin-top: 10px;
        }

        .register-btn:hover {
            background: linear-gradient(135deg, #578FCA 50%, #5078c1 100%);
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(239, 68, 68, 0.3);
        }

        .register-btn:active {
            transform: translateY(0);
            box-shadow: 0 2px 4px rgba(239, 68, 68, 0.2);
        }

        .register-footer {
            padding: 20px 30px;
            border-top: 1px solid #f0f0f0;
            text-align: center;
        }

        .login-link {
            color: #666;
            font-size: 14px;
        }

        .login-link a {
            color: #003ea8;
            font-weight: 600;
            text-decoration: none;
        }

        .login-link a:hover {
            text-decoration: underline;
        }

        .error-message {
            background-color: #FFEBEE;
            color: #B71C1C;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-size: 14px;
        }

        .error-message ul {
            margin-left: 20px;
        }

        @media (max-width: 576px) {
            .register-container {
                max-width: 100%;
                border-radius: 0;
            }

            .register-body {
                padding: 20px;
            }

            .form-row {
                flex-direction: column;
                gap: 0;
            }
        }
    </style>
</head>

<body>
    <div class="register-container">
        <div class="register-header">
            <div class="register-logo">
                <div class="register-logo-icon">
                    <i class="fas fa-globe" style="color: #003ea8; font-size: 28px;"></i>
                </div>
                <h1 class="register-title">Vistour</h1>
            </div>
            <p class="register-subtitle">註冊新帳號</p>
        </div>

        <div class="register-body">
            <?php if (!empty($errors)): ?>
                <div class="error-message">
                    <ul>
                        <?php foreach ($errors as $error): ?>
                            <li><?php echo htmlspecialchars($error); ?></li>
                        <?php endforeach; ?>
                    </ul>
                </div>
            <?php endif; ?>

            <form method="POST" action="<?php echo htmlspecialchars($_SERVER["PHP_SELF"]); ?>">
                <div class="form-group">
                    <label for="name">姓名</label>
                    <div class="input-with-icon">
                        <i class="fas fa-user"></i>
                        <input type="text" id="name" name="name" class="form-control" placeholder="請輸入姓名"
                            value="<?php echo htmlspecialchars($name); ?>" required>
                    </div>
                </div>

                <div class="form-group">
                    <label for="email">電子郵件</label>
                    <div class="input-with-icon">
                        <i class="fas fa-envelope"></i>
                        <input type="email" id="email" name="email" class="form-control" placeholder="請輸入電子郵件"
                            value="<?php echo htmlspecialchars($email); ?>" required>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="password">密碼</label>
                        <div class="input-with-icon">
                            <i class="fas fa-lock"></i>
                            <input type="password" id="password" name="password" class="form-control"
                                placeholder="請輸入密碼" required>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="confirm_password">確認密碼</label>
                        <div class="input-with-icon">
                            <i class="fas fa-lock"></i>
                            <input type="password" id="confirm_password" name="confirm_password" class="form-control"
                                placeholder="請再次輸入密碼" required>
                        </div>
                    </div>
                </div>

                <button type="submit" class="register-btn">註冊</button>
            </form>
        </div>

        <div class="register-footer">
            <p class="login-link">已有帳號？ <a href="login.php">立即登入</a></p>
        </div>
    </div>
</body>

</html>