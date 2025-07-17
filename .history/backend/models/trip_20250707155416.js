const Trip = sequelize.define('Trip', {
  t_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: DataTypes.STRING,
  country: DataTypes.STRING,
  s_date: DataTypes.DATEONLY,
  e_date: DataTypes.DATEONLY,
  s_time: DataTypes.TIME,
  e_time: DataTypes.TIME,
  time: DataTypes.STRING,
  stage: DataTypes.STRING,
  color: DataTypes.STRING
}, { timestamps: false });