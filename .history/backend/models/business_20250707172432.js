import { DataTypes } from 'sequelize';
import { sequelize } from '../db_settings.js';

const Business = sequelize.define('Business', {
    a_id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
    t_id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
    w_day: {
        type: DataTypes.ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'),
        allowNull: false,
        primaryKey: true
    },
    prriod: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },

    open_time: { type: DataTypes.TIME, allowNull: false },
    close_time: { type: DataTypes.TIME, allowNull: false }
}, {
    tableName: 'Business',
    timestamps: false,
});

export default Business;
