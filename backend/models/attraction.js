import { DataTypes } from 'sequelize';
import { sequelize } from '../db_settings.js';

const Attraction = sequelize.define('Attraction', {
    a_id:     { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    name_zh:  { type: DataTypes.STRING, allowNull: true },
    name:     { type: DataTypes.STRING, allowNull: true },
    category: { type: DataTypes.STRING, allowNull: true },
    address:  { type: DataTypes.STRING, allowNull: true },
    budget:   { type: DataTypes.FLOAT,  allowNull: true },
    photo:    { type: DataTypes.STRING, allowNull: true },
    country:  { type: DataTypes.STRING, allowNull: true },
    city:     { type: DataTypes.STRING, allowNull: true }

}, {
    tableName: 'Attraction',
    timestamps: false,
});

export default Attraction;