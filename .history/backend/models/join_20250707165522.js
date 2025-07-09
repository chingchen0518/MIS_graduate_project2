import { DataTypes } from 'sequelize';
import { sequelize } from '../db_settings.js';

const Join = sequelize.define('Join', {
  color: {
    type: DataTypes.STRING,
    allowNull: true,           // 色碼可選填（如果有預設色就設 defaultValue）
    validate: {
      is: /^#([0-9A-F]{3}){1,2}$/i  // 簡單 HEX 色碼格式驗證
    }
  }
}, {
  tableName: 'Join',           // 可改成更語意化的名稱，例如 'User_Trip' 或 'Trip_Label'
  timestamps: false
});

export default Join;
