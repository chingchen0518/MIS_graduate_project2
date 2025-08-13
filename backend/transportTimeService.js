import Attraction from './models/attraction.js';
import TransportTime from './models/transportTime.js';

/**
 * 計算兩個景點之間的交通時間並儲存到資料庫
 * @param {number} fromAId - 起點景點ID
 * @param {number} toAId - 終點景點ID
 * @param {number} scheduleId - 行程ID
 * @param {string} date - 旅行日期 (格式: YYYY-MM-DD)
 * @returns {Object} 計算結果和資料庫儲存狀態
 */
export async function calculateAndStoreTransportTime(fromAId, toAId, scheduleId, date = new Date().toISOString().split('T')[0]) {
    try {
        console.log(`開始計算景點 ${fromAId} 到 ${toAId} 的交通時間...`);
        
        // 1. 從資料庫獲取兩個景點的經緯度資訊
        console.log(`🔍 查詢景點資料: ${fromAId} 和 ${toAId}`);
        const [fromAttraction, toAttraction] = await Promise.all([
            Attraction.findOne({ where: { a_id: fromAId } }),
            Attraction.findOne({ where: { a_id: toAId } })
        ]);

        console.log(` 從景點查詢結果:`, fromAttraction ? `${fromAttraction.name} (${fromAttraction.latitude}, ${fromAttraction.longitude})` : 'null');
        console.log(` 到景點查詢結果:`, toAttraction ? `${toAttraction.name} (${toAttraction.latitude}, ${toAttraction.longitude})` : 'null');

        // 檢查景點是否存在
        if (!fromAttraction) {
            const error = `找不到起點景點 ID: ${fromAId}`;
            console.error('❌', error);
            throw new Error(error);
        }
        if (!toAttraction) {
            const error = `找不到終點景點 ID: ${toAId}`;
            console.error('❌', error);
            throw new Error(error);
        }

        // 檢查經緯度是否存在
        if (!fromAttraction.latitude || !fromAttraction.longitude) {
            const error = `起點景點 ${fromAttraction.name} (ID: ${fromAId}) 缺少經緯度資訊 - latitude: ${fromAttraction.latitude}, longitude: ${fromAttraction.longitude}`;
            console.error('❌', error);
            throw new Error(error);
        }
        if (!toAttraction.latitude || !toAttraction.longitude) {
            const error = `終點景點 ${toAttraction.name} (ID: ${toAId}) 缺少經緯度資訊 - latitude: ${toAttraction.latitude}, longitude: ${toAttraction.longitude}`;
            console.error('❌', error);
            throw new Error(error);
        }

        console.log(`從 ${fromAttraction.name} (${fromAttraction.latitude}, ${fromAttraction.longitude}) 到 ${toAttraction.name} (${toAttraction.latitude}, ${toAttraction.longitude})`);

        // 2. 準備景點資料格式
        const fromLocation = {
            name: fromAttraction.name,
            coords: [fromAttraction.latitude, fromAttraction.longitude]
        };
        
        const toLocation = {
            name: toAttraction.name,
            coords: [toAttraction.latitude, toAttraction.longitude]
        };

        // 3. 動態引入交通時間計算函數（使用 apiUse.js 的方式）
        const { simpleCalculate } = await import('../src/view2/Liu/mapAddRoute/MapTest.js');
        
        // 4. 調用 API 計算交通時間（使用與 apiUse.js 相同的方式）
        const travelTimeResults = await simpleCalculate(fromLocation, toLocation, date);
        
        if (!travelTimeResults) {
            throw new Error('無法計算交通時間');
        }

        console.log('API 計算結果:', travelTimeResults);

        // 5. 解析各種交通方式的時間（分鐘）
        const transportTimes = {
            walk: null,
            bicycle: null,
            bus: null,
            car: null
        };

        // 解析步行時間
        if (travelTimeResults.walk && !travelTimeResults.walk.error) {
            transportTimes.walk = travelTimeResults.walk.duration;
            console.log(' 解析步行時間:', transportTimes.walk);
        } else if (travelTimeResults.WALK && !travelTimeResults.WALK.error) {
            transportTimes.walk = travelTimeResults.WALK.duration;
            console.log(' 解析步行時間 (WALK):', transportTimes.walk);
        } else {
            console.log(' 步行時間解析失敗:', travelTimeResults.walk || travelTimeResults.WALK);
        }

        // 解析腳踏車時間
        if (travelTimeResults.bicycle && !travelTimeResults.bicycle.error) {
            transportTimes.bicycle = travelTimeResults.bicycle.duration;
            console.log(' 解析腳踏車時間:', transportTimes.bicycle);
        } else if (travelTimeResults.BICYCLE && !travelTimeResults.BICYCLE.error) {
            transportTimes.bicycle = travelTimeResults.BICYCLE.duration;
            console.log(' 解析腳踏車時間 (BICYCLE):', transportTimes.bicycle);
        } else {
            console.log(' 腳踏車時間解析失敗:', travelTimeResults.bicycle || travelTimeResults.BICYCLE);
        }

        // 解析公車/大眾運輸時間
        console.log(' 檢查大眾運輸相關欄位:');
        console.log('  - travelTimeResults.transit:', travelTimeResults.transit);
        console.log('  - travelTimeResults.TRANSIT:', travelTimeResults.TRANSIT);
        console.log('  - travelTimeResults["TRANSIT,WALK"]:', travelTimeResults['TRANSIT,WALK']);
        
        // 列出所有可能的交通方式欄位
        console.log('🔍 所有可用的交通方式欄位:', Object.keys(travelTimeResults));
        
        if (travelTimeResults.transit && !travelTimeResults.transit.error) {
            transportTimes.bus = travelTimeResults.transit.duration;
            console.log(' 解析大眾運輸時間:', transportTimes.bus);
        } else if (travelTimeResults.TRANSIT && !travelTimeResults.TRANSIT.error) {
            transportTimes.bus = travelTimeResults.TRANSIT.duration;
            console.log(' 解析大眾運輸時間 (TRANSIT):', transportTimes.bus);
        } else if (travelTimeResults['TRANSIT,WALK'] && !travelTimeResults['TRANSIT,WALK'].error) {
            transportTimes.bus = travelTimeResults['TRANSIT,WALK'].duration;
            console.log(' 解析大眾運輸時間 (TRANSIT,WALK):', transportTimes.bus);
        } else {
            console.log(' 大眾運輸時間解析失敗:');
            console.log('   transit:', travelTimeResults.transit);
            console.log('   TRANSIT:', travelTimeResults.TRANSIT);
            console.log('   TRANSIT,WALK:', travelTimeResults['TRANSIT,WALK']);
        }

        // 解析汽車時間
        if (travelTimeResults.car && !travelTimeResults.car.error) {
            transportTimes.car = travelTimeResults.car.duration;
        } else if (travelTimeResults.CAR && !travelTimeResults.CAR.error) {
            transportTimes.car = travelTimeResults.CAR.duration;
        } else {
        }

        console.log('📊 最終 transportTimes:', transportTimes);

        // 6. 檢查是否已存在該路線的記錄
        let existingRecord = await TransportTime.findOne({
            where: {
                from_a_id: fromAId,
                to_a_id: toAId,
                s_id: scheduleId
            }
        });

        // 7. 儲存或更新到資料庫
        console.log('💾 準備儲存到資料庫...');
        console.log('💾 儲存資料:', {
            from_a_id: fromAId,
            to_a_id: toAId,
            s_id: scheduleId,
            walk: transportTimes.walk,
            bicycle: transportTimes.bicycle,
            bus: transportTimes.bus,
            car: transportTimes.car
        });

        try {
            if (existingRecord) {
                // 更新現有記錄
                console.log('🔄 更新現有記錄...');
                const updateResult = await existingRecord.update({
                    walk: transportTimes.walk,
                    bicycle: transportTimes.bicycle,
                    bus: transportTimes.bus,
                    car: transportTimes.car
                });
                console.log(`✅ 已更新交通時間記錄: ${fromAId} → ${toAId} (行程 ${scheduleId})`);
                console.log('✅ 更新結果:', updateResult.toJSON());
            } else {
                // 創建新記錄
                console.log('🆕 創建新記錄...');
                const createResult = await TransportTime.create({
                    from_a_id: fromAId,
                    to_a_id: toAId,
                    s_id: scheduleId,
                    walk: transportTimes.walk,
                    bicycle: transportTimes.bicycle,
                    bus: transportTimes.bus,
                    car: transportTimes.car
                });
                console.log(`✅ 已新增交通時間記錄: ${fromAId} → ${toAId} (行程 ${scheduleId})`);
                console.log('✅ 創建結果:', createResult.toJSON());
            }

            // 驗證是否真的儲存成功
            console.log('🔍 驗證儲存結果...');
            const verifyRecord = await TransportTime.findOne({
                where: {
                    from_a_id: fromAId,
                    to_a_id: toAId,
                    s_id: scheduleId
                }
            });
            
            if (verifyRecord) {
                console.log('✅ 驗證成功：資料已儲存到資料庫');
                console.log('✅ 驗證資料:', verifyRecord.toJSON());
            } else {
                console.error('❌ 驗證失敗：資料未儲存到資料庫');
                throw new Error('資料庫儲存驗證失敗');
            }

        } catch (dbError) {
            console.error('❌ 資料庫操作失敗:', dbError);
            console.error('❌ 錯誤詳情:', dbError.message);
            console.error('❌ 錯誤堆疊:', dbError.stack);
            throw new Error(`資料庫儲存失敗: ${dbError.message}`);
        }

        return {
            success: true,
            from: {
                id: fromAId,
                name: fromAttraction.name,
                coords: [fromAttraction.latitude, fromAttraction.longitude]
            },
            to: {
                id: toAId,
                name: toAttraction.name,
                coords: [toAttraction.latitude, toAttraction.longitude]
            },
            scheduleId: scheduleId,
            transportTimes: transportTimes,
            apiResults: travelTimeResults
        };

    } catch (error) {
        return {
            success: false,
            error: error.message,
            fromAId: fromAId,
            toAId: toAId,
            scheduleId: scheduleId
        };
    }
}

/**
 * 為整個行程計算所有相鄰景點間的交通時間
 * @param {Array<number>} attractionIds - 景點ID陣列（按行程順序排列）
 * @param {number} scheduleId - 行程ID
 * @param {string} date - 旅行日期
 * @returns {Array} 所有計算結果
 */
export async function calculateScheduleTransportTimes(attractionIds, scheduleId, date = new Date().toISOString().split('T')[0]) {
    const results = [];
    
    try {
        console.log(`開始計算行程 ${scheduleId} 的所有交通時間...`);
        console.log(`景點順序: ${attractionIds.join(' → ')}`);

        // 計算每對相鄰景點之間的交通時間
        for (let i = 0; i < attractionIds.length - 1; i++) {
            const fromAId = attractionIds[i];
            const toAId = attractionIds[i + 1];
            
            console.log(`計算第 ${i + 1} 段: ${fromAId} → ${toAId}`);
            
            const result = await calculateAndStoreTransportTime(fromAId, toAId, scheduleId, date);
            results.push(result);
            
            // 避免API請求過於頻繁，加入短暫延遲
            if (i < attractionIds.length - 2) {
                await new Promise(resolve => setTimeout(resolve, 1000)); // 延遲1秒
            }
        }

        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;
        
        console.log(`行程 ${scheduleId} 交通時間計算完成: ${successCount} 成功, ${failCount} 失敗`);
        
        return {
            success: true,
            scheduleId: scheduleId,
            totalRoutes: results.length,
            successCount: successCount,
            failCount: failCount,
            results: results
        };

    } catch (error) {
        console.error('計算行程交通時間時發生錯誤:', error);
        return {
            success: false,
            error: error.message,
            scheduleId: scheduleId,
            results: results
        };
    }
}

/**
 * 獲取兩個景點間的交通時間（從資料庫）
 * @param {number} fromAId - 起點景點ID
 * @param {number} toAId - 終點景點ID
 * @param {number} scheduleId - 行程ID
 * @returns {Object|null} 交通時間資料
 */
export async function getTransportTime(fromAId, toAId, scheduleId) {
    try {
        const record = await TransportTime.findOne({
            where: {
                from_a_id: fromAId,
                to_a_id: toAId,
                s_id: scheduleId
            }
        });

        return record ? record.toJSON() : null;
    } catch (error) {
        console.error('獲取交通時間時發生錯誤:', error);
        return null;
    }
}
