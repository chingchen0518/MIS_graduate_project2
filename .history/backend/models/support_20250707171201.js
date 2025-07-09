import { DataTypes } from 'sequelize';
import { sequelize } from '../db_settings.js';

const Support = sequelize.define('Support', {
  u_id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
    a_id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
  
  Reason: { type: DataTypes.STRING, allowNull: true },
  onelove: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
  twolove: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 }
}, {
  tableName: 'Support',
  timestamps: false
});

export default Support;
