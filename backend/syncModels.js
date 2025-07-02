import * as models from './models/index.js';
import { sequelize } from './db_settings.js';


// 自動檢查 models/index.js 內的 model 是否存在於資料庫，若無則自動建表
async function syncModels() {
  try {
    for (const model of Object.values(models)) {
      await model.sync({ alter: true });
    }
    console.log('✅ 所有模型已同步（如不存在則自動建表）');
  } catch (err) {
    console.error('❌ 同步模型時發生錯誤：', err);
  } finally {
    await sequelize.close();
  }
}

syncModels();