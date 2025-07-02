import { DataTypes } from 'sequelize';
import { sequelize } from '../db_settings.js';

const Student = sequelize.define('Student', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING }
}, {
  tableName: 'students',
  timestamps: false,
});

export default Student;