import { DataTypes } from 'sequelize';
import { sequelize } from '../db_settings.js';

const Weekday = sequelize.define('Weekday', {
    w_day:     { type: DataTypes.STRING, primaryKey: true, allowNull: false }
}, {
    tableName: 'Weekday',
    timestamps: false,
});



export default Weekday;
