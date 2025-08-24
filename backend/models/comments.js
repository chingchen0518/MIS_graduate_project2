import { DataTypes } from 'sequelize';
import { sequelize } from '../db_settings.js';

// ------ 匯入真實資料 ------ // 
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 正確的 JSON 路徑 (models/data/comment_data.json)
const filePath = path.join(__dirname, 'data', 'comment_data.json');

console.log('comment_data.json absolute path:', filePath);  // 在這裡印路徑

// 讀取 JSON
let commentData = [];
try {
    commentData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    console.log("✅ comment_data.json 成功載入，共", commentData.length, "筆資料");
} catch (err) {
    console.error("❌ 讀取 comment_data.json 失敗:", err);
}

// Sequelize 定義
const Comment = sequelize.define('Comment', {
    id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    t_id:        { type: DataTypes.INTEGER, allowNull: false },
    a_id:        { type: DataTypes.INTEGER, allowNull: false },

    user_id:     { type: DataTypes.JSON, allowNull: true },
    content:     { type: DataTypes.JSON, allowNull: true },
    created_at:  { type: DataTypes.JSON, allowNull: true },
}, {
    tableName: 'Comment',
    timestamps: false,
});

export default Comment;
