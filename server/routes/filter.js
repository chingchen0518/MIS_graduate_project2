const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '你的密碼',
    database: 'travel'
});

router.get('/categories', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT DISTINCT category FROM attraction');
        const categories = rows.map(row => row.category).filter(Boolean);
        res.json(categories);
    } catch (err) {
        res.status(500).json({ message: '資料庫錯誤' });
    }
});

module.exports = router;
