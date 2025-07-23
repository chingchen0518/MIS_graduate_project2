import * as models from './index.js';
import { sequelize } from './db_settings.js';

async function syncModels() {
  try {
    await models.User.sync({ alter: true });
    await models.Trip.sync({ alter: true });
    await models.Schedule.sync({ alter: true });
    await models.Attraction.sync({ alter: true });
    await models.Weekday.sync({ alter: true });
    await models.Join.sync({ alter: true });
    await models.Include2.sync({ alter: true });
    await models.Evaluate.sync({ alter: true });
    await models.Support.sync({ alter: true });
    await models.Business.sync({ alter: true });
    await models.Hotel.sync({ alter: true });

    console.log('✅ 所有模型已依指定順序同步（如不存在則自動建表）');
  } catch (err) {
    console.error('❌ 同步模型時發生錯誤：', err);
  } finally {
    await sequelize.close();
  }
}

syncModels();
