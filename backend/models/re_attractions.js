import { DataTypes } from 'sequelize';
import { sequelize } from '../db_settings.js';

const ReAttraction = sequelize.define('ReAttraction', {
    re_a_id:   { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    t_id:      { type: DataTypes.INTEGER, allowNull: true },
    a_id:      { type: DataTypes.INTEGER, allowNull: false },

    vote_like: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
    who_like:  { type: DataTypes.JSON, allowNull: true },

    vote_love: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
    who_love:  { type: DataTypes.JSON, allowNull: true },

}, {
    tableName: 'ReAttraction',
    timestamps: false,
});

export default ReAttraction;
