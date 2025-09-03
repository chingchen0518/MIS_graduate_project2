import { Sequelize } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';


// 取得 __dirname 的方式（ES Module 環境）
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


//引入.env中的port
dotenv.config({ path: path.join(__dirname, '../.env') });
const host = process.env.VITE_API_URL

console.log("host in db_settings:",host )

// 直接在這裡設定資料庫連線
const sequelize = new Sequelize('travel', 'root', '20250101', {
  host: host,
  dialect: 'mysql',
});

export { sequelize };


