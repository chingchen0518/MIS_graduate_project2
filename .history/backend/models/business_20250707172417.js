import { DataTypes } from 'sequelize';
import { sequelize } from '../db_settings.js';

const Business = sequelize.define('Business', {
    a_id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
    a_id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
    w_day: {
        type: DataTypes.ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'),
        allowNull: false,
        primaryKey: true
    },
    sequence: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true }, // 第幾個時段

    open_time: { type: DataTypes.TIME, allowNull: false },
    close_time: { type: DataTypes.TIME, allowNull: false }
}, {
    tableName: 'Business',
    timestamps: false,
});

export default Business;
