import { DataTypes } from 'sequelize';
import { sequelize } from '../db_settings.js';

const User = sequelize.define('User', {
    u_id:       { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    u_img:      { type: DataTypes.STRING, allowNull: true },
    u_name:     { type: DataTypes.STRING, allowNull: false },
    u_email:    { type: DataTypes.STRING, allowNull: false },
    u_password: { type: DataTypes.STRING, allowNull: false },
    u_account:  { type: DataTypes.STRING, allowNull: false }
}, {
  tableName: 'User',
  timestamps: false,
});

export default User;
