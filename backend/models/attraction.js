import { DataTypes } from 'sequelize';
import { sequelize } from '../db_settings.js';

// ------ 匯入真實資料 ------ // 
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 正確的 JSON 路徑 (models/data/attraction_data.json)
const filePath = path.join(__dirname, 'data', 'attraction_data.json');

console.log('attraction_data.json absolute path:', filePath);  // 在這裡印路徑

// 讀取 JSON
let attractionData = [];
try {
  attractionData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  console.log("✅ attraction_data.json 成功載入，共", attractionData.length, "筆資料");
} catch (err) {
  console.error("❌ 讀取 attraction_data.json 失敗:", err);
}

const Attraction = sequelize.define('Attraction', {
  a_id:     { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name_zh:  { type: DataTypes.STRING, allowNull: true },
  name:     { type: DataTypes.STRING, allowNull: true },
  category: { type: DataTypes.STRING, allowNull: true },
  address:  { type: DataTypes.STRING, allowNull: true },
  budget:   { type: DataTypes.FLOAT,  allowNull: true },
  photo:    { type: DataTypes.STRING, allowNull: true },
  country:  { type: DataTypes.STRING, allowNull: true },
  city:     { type: DataTypes.STRING, allowNull: true }
}, {
  tableName: 'Attraction',
  timestamps: false,
});

export default Attraction;
