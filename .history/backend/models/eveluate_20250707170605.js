import { DataTypes } from 'sequelize';
import { sequelize } from '../db_settings.js';

const Evaluate = sequelize.define('Evaluate', {
  u_id: { type: DataTypes.INTEGER, allowNull: false },
  s_id: { type: DataTypes.INTEGER, allowNull: false },
  t_id: { type: DataTypes.INTEGER, allowNull: false },
  good: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  bad: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
}, {
  tableName: 'Evaluate',
  timestamps: false
});

export default Evaluate;
