import { DataTypes } from 'sequelize';
import { sequelize } from '../db_settings.js';

const Schedule = sequelize.define('Schedule', {
  s_id:     { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  t_id:     { type: DataTypes.INTEGER, allowNull: false },  // ← 外鍵，指向 Trip.t_id

  date:     { type: DataTypes.DATEONLY, allowNull: false },

  walk_t:   { type: DataTypes.FLOAT, allowNull: true },
  car_t:    { type: DataTypes.FLOAT, allowNull: true },
  public_t: { type: DataTypes.FLOAT, allowNull: true },
  motor_t:  { type: DataTypes.FLOAT, allowNull: true },

  sequence: { type: DataTypes.INTEGER, allowNull: false }   // 表示第幾天或第幾站
}, {
  tableName: 'Schedule',
  timestamps: false,
});

export default Schedule;
