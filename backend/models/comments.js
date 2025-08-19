import { DataTypes } from "sequelize";
import { sequelize } from "../db_settings.js";

const Comment = sequelize.define(
    "Comment",
    {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    attraction_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    },
    {
    tableName: "comments",
    timestamps: false, // 因為 SQL 檔只有 created_at
    }
);

export default Comment;
