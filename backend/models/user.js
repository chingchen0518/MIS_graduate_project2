import { DataTypes } from 'sequelize';
import { sequelize } from '../db_settings.js';

// ------ 匯入真實資料 ------ // 
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'data', 'user_data.json');

console.log('user_data.json absolute path:', filePath);  // 在這裡印路徑

// 讀取 JSON
let attractionData = [];
try {
    attractionData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    console.log("✅ user_data.json 成功載入，共", UserData.length, "筆資料");
} catch (err) {
    console.error("❌ 讀取 user_data.json 失敗:", err);
}

const User = sequelize.define('User', {
    u_id:       { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    u_img:      { type: DataTypes.STRING, allowNull: true },
    u_name:     { type: DataTypes.STRING, allowNull: false },
    u_email:    { type: DataTypes.STRING, allowNull: false },
    u_password: { type: DataTypes.STRING, allowNull: false },
    u_account:  { type: DataTypes.STRING, allowNull: false },
    u_line_id:  { type: DataTypes.STRING, allowNull: true },
    into_trip:  { type: DataTypes.JSON, allowNull: true }
}, {
    tableName: 'User',
    timestamps: false,
});

export default User;
