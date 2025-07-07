import { DataTypes } from 'sequelize';
import { sequelize } from '../db_settings.js';

const Trip = sequelize.define('Trip', {
  t_id:    { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title:   { type: DataTypes.STRING, allowNull: false },
  country: { type: DataTypes.STRING, allowNull: false },
  s_date:  { type: DataTypes.DATEONLY, allowNull: false },
  e_date:  { type: DataTypes.DATEONLY, allowNull: false },
  s_time:  { type: DataTypes.TIME, allowNull: false },
  e_time:  { type: DataTypes.TIME, allowNull: false },
  time:    { type: DataTypes.STRING, allowNull: true },
  stage:   { type: DataTypes.STRING, allowNull: true }
}, {
  tableName: 'Trip',
  timestamps: false,
});

export default Trip;
