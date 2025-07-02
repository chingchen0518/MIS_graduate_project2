import { DataTypes } from 'sequelize';
import { sequelize } from '../db_settings.js';

const Teacher = sequelize.define('Teacher', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  line: { type: DataTypes.STRING },
  phone: { type: DataTypes.STRING }
}, {
  tableName: 'teachers',
  timestamps: false,
});

export default Teacher;