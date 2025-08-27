import { DataTypes } from 'sequelize';
import { sequelize } from '../db_settings.js';

const Join = sequelize.define('Join', {
  u_id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
  t_id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
  color: { type: DataTypes.STRING, allowNull: true, validate: { is: /^#([0-9A-F]{3}){1,2}$/i } },
  seed: { type: DataTypes.INTEGER, allowNull: true }
}, {
  tableName: 'Join',
  timestamps: false
});

export default Join;
