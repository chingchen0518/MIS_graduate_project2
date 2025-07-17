import { DataTypes } from 'sequelize';
import { sequelize } from '../db_settings.js';

// 定義模型
const User = sequelize.define('User', {
  u_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  u_name: DataTypes.STRING,
  u_email: DataTypes.STRING,
  u_password: DataTypes.STRING,
  u_account: DataTypes.STRING,
  u_img: DataTypes.STRING
}, { timestamps: false });
