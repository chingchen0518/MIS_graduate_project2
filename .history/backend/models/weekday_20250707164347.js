import { DataTypes } from 'sequelize';
import { sequelize } from '../db_settings.js';

const Weekday = sequelize.define('Weekday', {
    w_day: {
    type: DataTypes.ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'),
    primaryKey: true,
    allowNull: false
    }

});



export default Weekday;
