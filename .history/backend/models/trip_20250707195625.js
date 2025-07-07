import { DataTypes } from 'sequelize';
import { sequelize } from '../db_settings.js';

const Trip = sequelize.define('Trip', {
    t_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    
    s_date:  { type: DataTypes.DATEONLY, allowNull: false },
    e_date:  { type: DataTypes.DATEONLY, allowNull: false },
    s_time:  { type: DataTypes.TIME, allowNull: false },
    e_time:  { type: DataTypes.TIME, allowNull: false },
    country: { type: DataTypes.STRING, allowNull: false },
    stage_date:  { type: DataTypes.TIME, allowNull: false },
    time: { type: DataTypes.TIME, allowNull: false },
    title:   { type: DataTypes.STRING, allowNull: false },
    stage: { type: DataTypes.STRING, allowNull: true },

    u_id:    { type: DataTypes.INTEGER, allowNull: false }
}, {
    tableName: 'Trip',
    timestamps: false,
});

export default Trip;
