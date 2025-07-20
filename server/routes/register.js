const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');

// 請根據你的資料庫設定修改下方資訊
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '20250101',
    database: 'travel'
});

router.post('/', async (req, res) => {
    // 支援更多欄位（新增 account）
    const { name, email, account, password } = req.body;

    // 檢查欄位（新增 account）
    if (!name || !email || !account || !password) {
        return res.status(400).json({ message: '缺少必要欄位' });
    }

    try {
        // 插入四個欄位：name、email、account、password
        const sql = `INSERT INTO User (u_name, u_email, u_account, u_password)
                     VALUES (?, ?, ?, ?)`;
        await pool.execute(sql, [name, email, account, password]);

        res.json({ message: '註冊成功' });
    } catch (err) {
        console.error('資料庫錯誤:', err);

        // 可選：更細緻的錯誤處理
        if (err.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ message: '此電子郵件或帳號已被使用', error: err.message });
        } else {
            res.status(500).json({ message: '資料庫錯誤', error: err.message });
        }
    }
});

module.exports = router;
