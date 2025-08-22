import { DataTypes } from 'sequelize';
import { sequelize } from '../db_settings.js';

// ------ 匯入真實資料 ------ // 
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 正確的 JSON 路徑 (models/data/attraction_data.json)
const filePath = path.join(__dirname, 'data', 'ReAttraction_data.json');

console.log('attraction_data.json absolute path:', filePath);  // 在這裡印路徑

// 讀取 JSON
let attractionData = [];
try {
    attractionData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    console.log("✅ ReAttraction_data.json 成功載入，共", attractionData.length, "筆資料");
} catch (err) {
    console.error("❌ 讀取 ReAttraction_data.json 失敗:", err);
}

const ReAttraction = sequelize.define('ReAttraction', {
    re_a_id:   { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    t_id:      { type: DataTypes.INTEGER, allowNull: true },
    a_id:      { type: DataTypes.INTEGER, allowNull: false },

    vote_like: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
    who_like:  { type: DataTypes.JSON, allowNull: true },

    vote_love: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
    who_love:  { type: DataTypes.JSON, allowNull: true },

}, {
    tableName: 'ReAttraction',
    timestamps: false,
});

export default ReAttraction;
