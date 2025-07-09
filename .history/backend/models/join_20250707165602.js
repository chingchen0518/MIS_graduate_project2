import { DataTypes } from 'sequelize';
import { sequelize } from '../db_settings.js';

const Join = sequelize.define('Join', {
color: {
type: DataTypes.STRING,
allowNull: true, 
validate: {
    is: /^#([0-9A-F]{3}){1,2}$/i
}
}
}, {
    tableName: 'Join',
    timestamps: false
});

export default Join;
