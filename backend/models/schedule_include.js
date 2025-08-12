import { DataTypes } from 'sequelize';
import { sequelize } from '../db_settings.js';

const Schedule_include = sequelize.define('Schedule_include', {
  //id of which schedule
  s_id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
  
  //id of attraction
  a_id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
  
  //id of trip
  t_id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },

  // x and y coordinates of the attraction in the schedule
  
  y: { type: DataTypes.FLOAT, allowNull: false },

  // height of the attraction item in a schedule
  height: { type: DataTypes.FLOAT, allowNull: false },
  sequence: { type: DataTypes.INTEGER, allowNull: false },

//   walk_t: { type: DataTypes.TIME, allowNull: true },
//   car_t: { type: DataTypes.TIME, allowNull: true },
//   motor_t: { type: DataTypes.TIME, allowNull: true },
//   public_t: { type: DataTypes.TIME, allowNull: true }
}, {
  tableName: 'Schedule_include',
  timestamps: false
});

export default Schedule_include;
