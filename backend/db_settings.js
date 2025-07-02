import { Sequelize } from 'sequelize';

// 直接在這裡設定資料庫連線
const sequelize = new Sequelize('students', 'root', '20250101', {
  host: 'localhost',
  dialect: 'mysql',
});

export { sequelize };


