import { DataTypes } from 'sequelize';
import { sequelize } from '../db_settings.js';

const Trip = sequelize.define('Trip', {
    t_id:        { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title:       { type: DataTypes.STRING, allowNull: true },
    country:     { type: DataTypes.STRING, allowNull: true },
    s_date:      { type: DataTypes.DATEONLY, allowNull: true },
    e_date:      { type: DataTypes.DATEONLY, allowNull: true },
    s_time:      { type: DataTypes.TIME, allowNull: true },
    e_time:      { type: DataTypes.TIME, allowNull: true },
    hotel:       { type: DataTypes.STRING, allowNull: true },
    time:        { type: DataTypes.STRING, allowNull: true },
    stage:       { type: DataTypes.STRING, allowNull: true },
    color:       { type: DataTypes.STRING, allowNull: true },
    UserUId:     { type: DataTypes.INTEGER, allowNull: true },
    CreatorUId:  { type: DataTypes.INTEGER, allowNull: true }
});

export default Trip;
