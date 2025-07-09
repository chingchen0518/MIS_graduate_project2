import { DataTypes } from 'sequelize';
import { sequelize } from '../db_settings.js';

const Include2 = sequelize.define('Include2', {
  s_id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
  a_id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },  // 外鍵，指向 Attraction.a_id

  sequence: { type: DataTypes.INTEGER, allowNull: false },

  walk_t: { type: DataTypes.TIME, allowNull: true },
  car_t: { type: DataTypes.TIME, allowNull: true },
  motor_t: { type: DataTypes.TIME, allowNull: true },
  public_t: { type: DataTypes.TIME, allowNull: true }
}, {
  tableName: 'Include2',
  timestamps: false
});

export default Include2;
