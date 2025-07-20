<?php
session_start();
require_once 'db_connection.php';

// 檢查是否已經登入
if (isset($_SESSION['UserID'])) {
    header("Location: delivery-driver.php");
    exit();
}

// 初始化變數
$email = '';
$message = '';
$messageType = '';
$step = 1; // 步驟1：輸入郵箱，步驟2：輸入新密碼

// 處理密碼重設請求
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // 步驟1：請求重設密碼
    if (isset($_POST['request_reset'])) {
        $email = filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL);
        
        // 驗證電子郵件
        if (empty($email)) {
            $message = '請輸入電子郵件地址';
            $messageType = 'error';
        } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $message = '請輸入有效的電子郵件地址';
            $messageType = 'error';
        } else {
            // 檢查用戶是否存在
            $user = dbFetchRow("SELECT UserID, Name FROM user WHERE Email = ?", [$email], "s");
            
            if ($user) {
                // 生成重設令牌和過期時間
                $token = bin2hex(random_bytes(32));
                $expires = date('Y-m-d H:i:s', strtotime('+1 hour'));
                
                // 將重設令牌儲存在 session 中 (實際情況應該儲存到數據庫)
                $_SESSION['reset_token'] = [
                    'email' => $email,
                    'token' => $token,
                    'expires' => $expires,
                    'user_id' => $user['UserID']
                ];
                
                // 轉移到第二步驟
                $step = 2;
                $message = "{$user['Name']}，請設置您的新密碼。";
                $messageType = 'success';
                
                // 注意：在實際生產環境中，應該給用戶發送包含重設連結的郵件
                // sendPasswordResetEmail($email, $token, $user['Name']);
            } else {
                $message = '找不到使用此電子郵件的帳戶';
                $messageType = 'error';
            }
        }
    }
    
    // 步驟2：設置新密碼
    if (isset($_POST['reset_password'])) {
        // 從 session 獲取重設令牌
        $resetData = $_SESSION['reset_token'] ?? null;
        
        // 驗證令牌是否有效
        if (!$resetData || $resetData['email'] !== $_POST['email'] || strtotime($resetData['expires']) < time()) {
            $message = '密碼重設連結已失效，請重新請求';
            $messageType = 'error';
            $step = 1;
        } else {
            $password = $_POST['password'] ?? '';
            $confirmPassword = $_POST['confirm_password'] ?? '';
            
            // 驗證密碼
            if (empty($password)) {
                $message = '請輸入密碼';
                $messageType = 'error';
                $step = 2;
            } elseif (strlen($password) < 6) {
                $message = '密碼必須至少6個字符';
                $messageType = 'error';
                $step = 2;
            } elseif ($password !== $confirmPassword) {
                $message = '兩次輸入的密碼不一致';
                $messageType = 'error';
                $step = 2;
            } else {
                // 更新密碼
                // 注意：實際生產環境應使用 password_hash()
                $updated = dbUpdate(
                    "UPDATE user SET Password = ? WHERE UserID = ?",
                    [$password, $resetData['user_id']],
                    "si"
                );
                
                if ($updated) {
                    // 清除重設令牌
                    unset($_SESSION['reset_token']);
                    
                    // 顯示成功訊息
                    $message = '密碼已成功重設，您現在可以使用新密碼登入';
                    $messageType = 'success';
                    
                    // 設置一個成功標誌，在登入頁面顯示訊息
                    $_SESSION['password_reset_success'] = true;
                    
                    // 跳轉到登入頁面
                    header("Location: login.php");
                    exit();
                } else {
                    $message = '密碼重設失敗，請稍後再試';
                    $messageType = 'error';
                    $step = 2;
                }
            }
        }
    }
}
?>
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vistour - 忘記密碼</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="forgotpassword.css">
</head>
<body>
    <div class="password-reset-container">
        <div class="password-reset-header">
            <div class="password-reset-logo">
                <img src="Vistour_icon.png" alt="Vistour Logo" class="password-reset-logo-icon">
                <h1 class="password-reset-title">Vistour</h1>
            </div>
            <p class="password-reset-subtitle">重設您的密碼</p>
        </div>
        
        <div class="password-reset-body">
            <div class="step-indicator">
                <div class="step <?php echo ($step >= 1) ? 'active' : ''; ?>">1</div>
                <div class="step-connector <?php echo ($step >= 2) ? 'active' : ''; ?>"></div>
                <div class="step <?php echo ($step >= 2) ? 'active' : ''; ?>">2</div>
            </div>
            
            <?php if (!empty($message)): ?>
                <div class="message <?php echo $messageType; ?>">
                    <i class="fas fa-<?php echo $messageType === 'error' ? 'exclamation-circle' : 'check-circle'; ?>"></i>
                    <span><?php echo htmlspecialchars($message); ?></span>
                </div>
            <?php endif; ?>
            
            <?php if ($step === 1): ?>
                <!-- 步驟 1：請求重設密碼 -->
                <form method="POST" action="<?php echo htmlspecialchars($_SERVER["PHP_SELF"]); ?>">
                    <div class="form-group">
                        <label for="email">請輸入您的電子郵件地址</label>
                        <div class="input-with-icon">
                            <i class="fas fa-envelope"></i>
                            <input type="email" id="email" name="email" class="form-control" placeholder="您的註冊電子郵件" value="<?php echo htmlspecialchars($email); ?>" required>
                        </div>
                    </div>
                    
                    <p style="margin-bottom: 20px; color: #666; font-size: 13px;">
                        我們將向您發送密碼重設說明。如果您記不住註冊時使用的電子郵件，請聯繫客服。
                    </p>
                    
                    <button type="submit" name="request_reset" class="reset-btn">請求重設密碼</button>
                </form>
            <?php else: ?>
                <!-- 步驟 2：設置新密碼 -->
                <form method="POST" action="<?php echo htmlspecialchars($_SERVER["PHP_SELF"]); ?>">
                    <input type="hidden" name="email" value="<?php echo htmlspecialchars($email); ?>">
                    
                    <div class="form-group">
                        <label for="password">新密碼</label>
                        <div class="input-with-icon">
                            <i class="fas fa-lock"></i>
                            <input type="password" id="password" name="password" class="form-control" placeholder="請輸入新密碼" required>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="confirm_password">確認密碼</label>
                        <div class="input-with-icon">
                            <i class="fas fa-lock"></i>
                            <input type="password" id="confirm_password" name="confirm_password" class="form-control" placeholder="請再次輸入新密碼" required>
                        </div>
                    </div>
                    
                    <p style="margin-bottom: 20px; color: #666; font-size: 13px;">
                        密碼必須至少6個字符。請使用強密碼以確保您的帳戶安全。
                    </p>
                    
                    <button type="submit" name="reset_password" class="reset-btn">設置新密碼</button>
                </form>
            <?php endif; ?>
        </div>
        
        <div class="password-reset-footer">
            <p class="login-link">記得密碼？<a href="login.php">立即登入</a></p>
        </div>
    </div>
</body>
</html>