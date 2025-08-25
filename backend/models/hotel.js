import { DataTypes } from 'sequelize';
import { sequelize } from '../db_settings.js';

// ------ 匯入真實資料 ------ // 
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 正確的 JSON 路徑 (models/data/comment_data.json)
const filePath = path.join(__dirname, 'data', 'hotel_data.json');

console.log('hotel_data.json absolute path:', filePath);  // 在這裡印路徑

// 讀取 JSON
let commentData = [];
try {
    commentData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    console.log("✅ hotel_data.json 成功載入，共", commentData.length, "筆資料");
} catch (err) {
    console.error("❌ 讀取 hotel_data.json 失敗:", err);
}

const Hotel = sequelize.define('Hotel', {
    h_id:       { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name_zh:    { type: DataTypes.STRING(255), allowNull: true },
    name:       { type: DataTypes.STRING(255), allowNull: true },
    address:    { type: DataTypes.STRING(255), allowNull: true },
    country:    { type: DataTypes.STRING(255), allowNull: true },
    city:       { type: DataTypes.STRING(255), allowNull: true },
    cin_time:   { type: DataTypes.STRING(255), allowNull: true },
    cout_time:  { type: DataTypes.STRING(255), allowNull: true },
    rate:       { type: DataTypes.STRING(255), allowNull: true },
    price:      { type: DataTypes.INTEGER,    allowNull: true },
    description:{ type: DataTypes.TEXT,       allowNull: true },
    image_url:  { type: DataTypes.STRING(500),allowNull: true },
}, {
    tableName: 'Hotel',
    timestamps: false,
});

export default Hotel;
