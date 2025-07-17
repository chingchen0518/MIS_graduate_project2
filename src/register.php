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