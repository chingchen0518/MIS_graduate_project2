import { DataTypes } from 'sequelize';
import { sequelize } from '../db_settings.js';

const TripHotel = sequelize.define('TripHotel', {
    h_id:       { type: DataTypes.INTEGER, primaryKey: true },
    t_id:       { type: DataTypes.INTEGER, primaryKey: true },

    cin_time:   { type: DataTypes.DATEONLY, allowNull: true },
    cout_time: { type: DataTypes.DATEONLY, allowNull: true }
}, {
    tableName: 'TripHotel',
    timestamps: false,
});

export default TripHotel;
