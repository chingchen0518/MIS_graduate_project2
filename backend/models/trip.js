import { DataTypes } from 'sequelize';
import { sequelize } from '../db_settings.js';

const Trip = sequelize.define('Trip', {
  t_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false },
  u_id: { type: DataTypes.INTEGER },
  country: { type: DataTypes.STRING, allowNull: false },
  stage_date: { type: DataTypes.DATE, allowNull: false },
  s_date: { type: DataTypes.DATEONLY, allowNull: false },
  e_date: { type: DataTypes.DATEONLY, allowNull: false },
  s_time: { type: DataTypes.TIME, allowNull: false },
  e_time: { type: DataTypes.TIME, allowNull: false },
  hotel: { type: DataTypes.STRING, allowNull: true },
  time: { type: DataTypes.TIME, allowNull: false },
  stage: { type: DataTypes.STRING, allowNull: true },
  color: { type: DataTypes.STRING, allowNull: true },
  u_id: { type: DataTypes.INTEGER, allowNull: false },
  UserUId: { type: DataTypes.INTEGER, allowNull: true },
  CreatorUId: { type: DataTypes.INTEGER, allowNull: true },
  finished_day: { type: DataTypes.INTEGER, allowNull: false },
  hashedTid: { type: DataTypes.STRING, allowNull: true },

}, {
  tableName: 'Trip', // 明確指定資料表名稱
  timestamps: false
});

export default Trip;
