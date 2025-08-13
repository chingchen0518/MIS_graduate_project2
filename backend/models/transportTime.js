import { DataTypes } from 'sequelize';
import { sequelize } from '../db_settings.js';

const TransportTime = sequelize.define('TransportTime', {
    id: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true 
    },
    from_a_id: { 
        type: DataTypes.INTEGER, 
        allowNull: false,
        comment: '起點景點ID'
    },
    to_a_id: { 
        type: DataTypes.INTEGER, 
        allowNull: false,
        comment: '終點景點ID'
    },
    s_id: { 
        type: DataTypes.INTEGER, 
        allowNull: false,
        comment: '行程ID'
    },
    walk: { 
        type: DataTypes.INTEGER, 
        allowNull: true,
        comment: '步行時間（分鐘）'
    },
    bicycle: { 
        type: DataTypes.INTEGER, 
        allowNull: true,
        comment: '腳踏車時間（分鐘）'
    },
    bus: { 
        type: DataTypes.INTEGER, 
        allowNull: true,
        comment: '公車時間（分鐘）'
    },
    car: { 
        type: DataTypes.INTEGER, 
        allowNull: true,
        comment: '汽車時間（分鐘）'
    }
}, {
    tableName: 'transport_time',
    timestamps: false,
    indexes: [
        {
            unique: true,
            fields: ['from_a_id', 'to_a_id', 's_id'],
            name: 'unique_route_per_schedule'
        },
        {
            fields: ['s_id'],
            name: 'idx_schedule'
        },
        {
            fields: ['from_a_id'],
            name: 'idx_from_attraction'
        },
        {
            fields: ['to_a_id'],
            name: 'idx_to_attraction'
        }
    ]
});

export default TransportTime;
