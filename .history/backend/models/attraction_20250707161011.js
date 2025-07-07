import { DataTypes } from 'sequelize';
import { sequelize } from '../db_settings.js';

const Attraction = sequelize.define('Attraction', {
  a_id:     { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  
  t_id:     { type: DataTypes.INTEGER, allowNull: false },

  u_id:     { type: DataTypes.INTEGER, allowNull: false },  // 表示此景點與哪個 User 相關（例如擁有者）

  name:     { type: DataTypes.STRING, allowNull: false },
  category: { type: DataTypes.STRING, allowNull: true },
  address:  { type: DataTypes.STRING, allowNull: true },
  budget:   { type: DataTypes.FLOAT, allowNull: true },
  photo:    { type: DataTypes.STRING, allowNull: true }
}, {
  tableName: 'Attraction',
  timestamps: false,
});

export default Attraction;
