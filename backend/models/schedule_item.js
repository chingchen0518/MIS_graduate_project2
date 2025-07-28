import { DataTypes } from 'sequelize';
import { sequelize } from '../db_settings.js';
import Attraction from './attraction.js';
import Schedule from './schedule.js';

const ScheduleItem = sequelize.define('ScheduleItem', {
  si_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  a_id: { type: DataTypes.INTEGER, references: { model: Attraction, key: 'id' }, allowNull: false },
  s_id: { type: DataTypes.INTEGER, references: { model: Schedule, key: 'id' }, allowNull: false },
  x: { type: DataTypes.FLOAT, allowNull: false },
  y: { type: DataTypes.FLOAT, allowNull: false },
  motor: { type: DataTypes.INTEGER, allowNull: false },
  car: { type: DataTypes.INTEGER, allowNull: false },
  bus: { type: DataTypes.INTEGER, allowNull: false },
  walk: { type: DataTypes.INTEGER, allowNull: false }
});

export default ScheduleItem;
