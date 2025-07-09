import { DataTypes } from 'sequelize';
import { sequelize } from '../db_settings.js';

const Weekday = sequelize.define('Weekday', {
  w_day:     { type: DataTypes.STRING, primaryKey: true, allowNull: false }, // 例如 'Monday', 'Tue'
  period:    { type: DataTypes.STRING, allowNull: true },                   // 可為 NULL
  open_time: { type: DataTypes.TIME, allowNull: true },
  close_time:{ type: DataTypes.TIME, allowNull: true }
}, {
  tableName: 'Weekday',
  timestamps: false,
});

export default Weekday;
