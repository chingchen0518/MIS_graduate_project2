import { DataTypes } from 'sequelize';
import { sequelize } from '../db_settings.js';

const User = sequelize.define('Hotel', {
    h_id:       { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    h_img:      { type: DataTypes.STRING, allowNull: true },
    h_address:  { type: DataTypes.STRING, allowNull: true },
    h_name_zh:  { type: DataTypes.STRING, allowNull: false },
    h_name_en:  { type: DataTypes.STRING, allowNull: false },
    h_country:  { type: DataTypes.STRING, allowNull: false },
    h_city:     { type: DataTypes.STRING, allowNull: false },

    rate:       { type: DataTypes.FLOAT, allowNull: true }, // 可為 null，看你需求
    price:      { type: DataTypes.FLOAT, allowNull: true }, // 同上
    description:{ type: DataTypes.TEXT, allowNull: true },  // 用 TEXT 儲存較長的中文描述
    cin_time:   { type: DataTypes.DATE, allowNull: true },  // DATE 包含時間
    cout_time:  { type: DataTypes.DATE, allowNull: true },
}, {
    tableName: 'Hotel',
    timestamps: false,
});

export default Hotel;
