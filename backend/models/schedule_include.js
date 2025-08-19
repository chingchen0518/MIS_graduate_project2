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
    x: { type: DataTypes.FLOAT, allowNull: false },
    y: { type: DataTypes.FLOAT, allowNull: false },

    // height and sequence of the attraction item in a schedule
    height: { type: DataTypes.FLOAT, allowNull: false },
    sequence: { type: DataTypes.INTEGER, allowNull: false },

    //transportation type(1:car,2:bicycle,3:public,4:walk)
    transport_method: { type: DataTypes.INTEGER, allowNull: false},

}, {
  tableName: 'Schedule_include',
  timestamps: false
});

export default Schedule_include;
