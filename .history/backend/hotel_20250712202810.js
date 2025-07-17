import { DataTypes } from 'sequelize';
import { sequelize } from '../db_settings.js';

const User = sequelize.define('User', {
    h_id:       { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    h_img:      { type: DataTypes.STRING, allowNull: true },
    h_img:      { type: DataTypes.STRING, allowNull: true },
    h_name_zh:     { type: DataTypes.STRING, allowNull: false },
    h_name_en:     { type: DataTypes.STRING, allowNull: false },
    h_country:    { type: DataTypes.STRING, allowNull: false },
    h_city:    { type: DataTypes.STRING, allowNull: false },
    h_password: { type: DataTypes.STRING, allowNull: false },
    h_account:  { type: DataTypes.STRING, allowNull: false }
}, {
    tableName: 'User',
    timestamps: false,
});

export default User;
