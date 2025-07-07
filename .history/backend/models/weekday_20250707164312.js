import { DataTypes } from 'sequelize';
import { sequelize } from '../db_settings.js';

w_day: {
  type: DataTypes.ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'),
  primaryKey: true,
  allowNull: false
}


export default Weekday;
