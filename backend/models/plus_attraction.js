import { DataTypes } from 'sequelize';
import { sequelize } from '../db_settings.js';

// ------ 匯入真實資料 ------ // 
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 正確的 JSON 路徑 (models/data/attraction_data.json)
const filePath = path.join(__dirname, 'data', 'PlusAttraction_data.json');

console.log('PlusAttraction_data.json absolute path:', filePath);  // 在這裡印路徑

// 讀取 JSON
let attractionData = [];
try {
    attractionData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    console.log("✅ PlusAttraction_data.json 成功載入，共", attractionData.length, "筆資料");
} catch (err) {
    console.error("❌ 讀取 PlusAttraction_data.json 失敗:", err);
}

const PlusAttraction = sequelize.define('PlusAttraction', {
    t_id:      { type: DataTypes.INTEGER, allowNull: true },
    p_a_id:     { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    p_name_zh:  { type: DataTypes.STRING, allowNull: true },
    p_name:     { type: DataTypes.STRING, allowNull: true },
    p_category: { type: DataTypes.STRING, allowNull: true },
    p_address:  { type: DataTypes.STRING, allowNull: true },
    p_budget:   { type: DataTypes.FLOAT,  allowNull: true },
    p_photo:    { type: DataTypes.STRING, allowNull: true },
    p_country:  { type: DataTypes.STRING, allowNull: true },
    p_city:     { type: DataTypes.STRING, allowNull: true }
}, {
    tableName: 'PlusAttraction',
    timestamps: false,
});

export default PlusAttraction;
