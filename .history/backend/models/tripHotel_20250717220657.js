import { DataTypes } from 'sequelize';
import { sequelize } from '../db_settings.js';

const TripHotel = sequelize.define('TripHotel', {
    h_id:       { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    h_img:      { type: DataTypes.STRING, allowNull: true },
    h_address:  { type: DataTypes.STRING, allowNull: true },
    h_name_zh:  { type: DataTypes.STRING, allowNull: false },
    h_name_en:  { type: DataTypes.STRING, allowNull: false },
    h_country:  { type: DataTypes.STRING, allowNull: false },
    h_city:     { type: DataTypes.STRING, allowNull: false },
    price:      { type: DataTypes.FLOAT, allowNull: true },
    cin_time:   { type: DataTypes.DATE, allowNull: true },
    cout_time: { type: DataTypes.DATE, allowNull: true }
}, {
    tableName: 'Hotel',
    timestamps: false,
});

export default Hotel;
