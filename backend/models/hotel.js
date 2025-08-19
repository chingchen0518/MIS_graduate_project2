import { DataTypes } from 'sequelize';
import { sequelize } from '../db_settings.js';

const Hotel = sequelize.define('Hotel', {
    h_id:       { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name_zh:    { type: DataTypes.STRING(255), allowNull: true },
    name:       { type: DataTypes.STRING(255), allowNull: true },
    address:    { type: DataTypes.STRING(255), allowNull: true },
    country:    { type: DataTypes.STRING(255), allowNull: true },
    city:       { type: DataTypes.STRING(255), allowNull: true },
    cin_time:   { type: DataTypes.STRING(255), allowNull: true },
    cout_time:  { type: DataTypes.STRING(255), allowNull: true },
    rate:       { type: DataTypes.STRING(255), allowNull: true },
    price:      { type: DataTypes.INTEGER,    allowNull: true },
    description:{ type: DataTypes.TEXT,       allowNull: true },
    image_url:  { type: DataTypes.STRING(500),allowNull: true },
}, {
    tableName: 'Hotel',
    timestamps: false,
});

export default Hotel;
