import { DataTypes } from 'sequelize';
import { sequelize } from '../db_settings.js';

const Abcd = sequelize.define('Abcd', {
  idaaaaa: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nameaaa: { type: DataTypes.STRING, allowNull: false },
  emailaaa: { type: DataTypes.STRING }
}, {
  tableName: 'Abcd',
  timestamps: false,
});

export default Abcd;