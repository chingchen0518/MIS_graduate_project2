import { DataTypes } from 'sequelize';
import { sequelize } from '../db_settings.js';

const Schedule = sequelize.define('Schedule', {
    s_id:     { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    
    t_id: { type: DataTypes.INTEGER, allowNull: false },
    u_id:    { type: DataTypes.INTEGER, allowNull: false },
}, {
    tableName: 'Schedule',
    timestamps: false,
});

export default Schedule;
