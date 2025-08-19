import mysql from 'mysql2/promise';

/**
 * 計算兩個經緯度之間的直線距離（公里）
 * @param {number} lat1 起點緯度
 * @param {number} lon1 起點經度  
 * @param {number} lat2 終點緯度
 * @param {number} lon2 終點經度
 * @returns {number} 距離（公里）
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // 地球半徑（公里）
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

/**
 * 根據直線距離估算各種交通方式的時間
 * @param {number} distance 直線距離（公里）
 * @returns {Object} 估算的交通時間
 */
function estimateTimeFromDistance(distance) {
    // 考慮實際路線比直線距離長約 20-40%
    const actualDistance = distance * 1.3;
    
    return {
        walk: {
            duration: Math.round(actualDistance * 12), // 5 km/h = 12 分鐘/公里
            distance: actualDistance,
            estimated: true
        },
        bicycle: {
            duration: Math.round(actualDistance * 4), // 15 km/h = 4 分鐘/公里
            distance: actualDistance,
            estimated: true
        },
        car: {
            duration: Math.round(actualDistance * 1.5), // 40 km/h = 1.5 分鐘/公里
            distance: actualDistance,
            estimated: true
        },
        bus: {
            duration: Math.round(actualDistance * 2.5), // 24 km/h = 2.5 分鐘/公里（含等車時間）
            distance: actualDistance,
            estimated: true
        }
    };
}

/**
 * 計算兩個景點之間的交通時間並儲存到資料庫
 * @param {number} fromAId - 起點景點ID
 * @param {number} toAId - 終點景點ID
 * @param {number} scheduleId - 行程ID
 * @param {string} date - 旅行日期 (格式: YYYY-MM-DD)
 * @param {number} tripId - 旅程ID (可選)
 * @returns {Object} 計算結果和資料庫儲存狀態
 */
export async function calculateAndStoreTransportTime(fromAId, toAId, scheduleId, date = new Date().toISOString().split('T')[0]) {
    let connection;
    try {
        console.log(`開始計算景點 ${fromAId} 到 ${toAId} 的交通時間...`);
        
        // 建立資料庫連接
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '20250101',
            database: 'travel'
        });
        
        // 1. 從資料庫獲取兩個景點的經緯度資訊
        console.log(`🔍 查詢景點資料: ${fromAId} 和 ${toAId}`);
        const [fromRows] = await connection.execute(
            'SELECT a_id, name, latitude, longitude FROM attraction WHERE a_id = ?',
            [fromAId]
        );
        const [toRows] = await connection.execute(
            'SELECT a_id, name, latitude, longitude FROM attraction WHERE a_id = ?',
            [toAId]
        );

        const fromAttraction = fromRows[0];
        const toAttraction = toRows[0];        console.log(` 從景點查詢結果:`, fromAttraction ? `${fromAttraction.name} (${fromAttraction.latitude}, ${fromAttraction.longitude})` : 'null');
        console.log(` 到景點查詢結果:`, toAttraction ? `${toAttraction.name} (${toAttraction.latitude}, ${toAttraction.longitude})` : 'null');
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

        // 3. 計算直線距離作為基礎
        const distance = calculateDistance(
            fromAttraction.latitude, fromAttraction.longitude,
            toAttraction.latitude, toAttraction.longitude
        );
        console.log(`📏 直線距離: ${distance.toFixed(2)} km`);

        // 4. 嘗試使用 OTP API 計算，但設定較短超時時間
        let travelTimeResults = null;
        try {
            console.log('🚀 嘗試使用 OTP API 計算...');
            const { simpleCalculate } = await import('../src/view2/Liu/mapAddRoute/MapTest.js');
            
            // 使用 Promise.race 設定 15 秒超時
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('OTP API 超時')), 15000)
            );
            
            travelTimeResults = await Promise.race([
                simpleCalculate(fromLocation, toLocation, date),
                timeoutPromise
            ]);
            
            console.log('✅ OTP API 計算成功:', travelTimeResults);
        } catch (otpError) {
            console.log('⚠️ OTP API 失敗，使用距離估算:', otpError.message);
            
            // 使用距離估算作為 fallback
            travelTimeResults = estimateTimeFromDistance(distance);
        }

        console.log('API 計算結果:', travelTimeResults);

        // 5. 解析各種交通方式的時間（分鐘）
        const transportTimes = {
            walk: null,
            bicycle: null,
            bus: null,
            car: null
        };

        // 檢查是否為估算結果
        const isEstimated = travelTimeResults && travelTimeResults.walk && travelTimeResults.walk.estimated;
        
        if (isEstimated) {
            console.log('📊 使用距離估算結果');
            transportTimes.walk = travelTimeResults.walk.duration;
            transportTimes.bicycle = travelTimeResults.bicycle.duration;
            transportTimes.bus = travelTimeResults.bus.duration;
            transportTimes.car = travelTimeResults.car.duration;
        } else {
            // 解析 OTP API 結果
            console.log('📊 解析 OTP API 結果');
            
            // 解析步行時間
            if (travelTimeResults.walk && !travelTimeResults.walk.error) {
                transportTimes.walk = travelTimeResults.walk.duration;
                console.log(' 解析步行時間:', transportTimes.walk);
            } else if (travelTimeResults.WALK && !travelTimeResults.WALK.error) {
                transportTimes.walk = travelTimeResults.WALK.duration;
                console.log(' 解析步行時間 (WALK):', transportTimes.walk);
            } else {
                console.log(' 步行時間解析失敗，使用估算');
                const estimated = estimateTimeFromDistance(distance);
                transportTimes.walk = estimated.walk.duration;
            }

            // 解析腳踏車時間
            if (travelTimeResults.bicycle && !travelTimeResults.bicycle.error) {
                transportTimes.bicycle = travelTimeResults.bicycle.duration;
                console.log(' 解析腳踏車時間:', transportTimes.bicycle);
            } else if (travelTimeResults.BICYCLE && !travelTimeResults.BICYCLE.error) {
                transportTimes.bicycle = travelTimeResults.BICYCLE.duration;
                console.log(' 解析腳踏車時間 (BICYCLE):', transportTimes.bicycle);
            } else {
                console.log(' 腳踏車時間解析失敗，使用估算');
                const estimated = estimateTimeFromDistance(distance);
                transportTimes.bicycle = estimated.bicycle.duration;
            }

            // 解析公車/大眾運輸時間
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
                console.log(' 大眾運輸時間解析失敗，使用估算');
                const estimated = estimateTimeFromDistance(distance);
                transportTimes.bus = estimated.bus.duration;
            }

            // 解析汽車時間
            if (travelTimeResults.car && !travelTimeResults.car.error) {
                transportTimes.car = travelTimeResults.car.duration;
                console.log(' 解析汽車時間:', transportTimes.car);
            } else if (travelTimeResults.CAR && !travelTimeResults.CAR.error) {
                transportTimes.car = travelTimeResults.CAR.duration;
                console.log(' 解析汽車時間 (CAR):', transportTimes.car);
            } else {
                console.log(' 汽車時間解析失敗，使用估算');
                const estimated = estimateTimeFromDistance(distance);
                transportTimes.car = estimated.car.duration;
            }
        }

        console.log('📊 最終 transportTimes:', transportTimes);

        // 6. 檢查是否已存在該路線的記錄
        const [existingRows] = await connection.execute(
            'SELECT * FROM transport_time WHERE from_a_id = ? AND to_a_id = ? AND s_id = ?',
            [fromAId, toAId, scheduleId]
        );
        const existingRecord = existingRows[0];

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
                await connection.execute(
                    'UPDATE transport_time SET walk = ?, bicycle = ?, bus = ?, car = ? WHERE from_a_id = ? AND to_a_id = ? AND s_id = ?',
                    [transportTimes.walk, transportTimes.bicycle, transportTimes.bus, transportTimes.car, fromAId, toAId, scheduleId]
                );
                console.log(`✅ 已更新交通時間記錄: ${fromAId} → ${toAId} (行程 ${scheduleId})`);
            } else {
                // 創建新記錄
                console.log('🆕 創建新記錄...');
                await connection.execute(
                    'INSERT INTO transport_time (from_a_id, to_a_id, s_id, walk, bicycle, bus, car) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [fromAId, toAId, scheduleId, transportTimes.walk, transportTimes.bicycle, transportTimes.bus, transportTimes.car]
                );
                console.log(`✅ 已新增交通時間記錄: ${fromAId} → ${toAId} (行程 ${scheduleId})`);
            }

            // 驗證是否真的儲存成功
            console.log('🔍 驗證儲存結果...');
            const [verifyRows] = await connection.execute(
                'SELECT * FROM transport_time WHERE from_a_id = ? AND to_a_id = ? AND s_id = ?',
                [fromAId, toAId, scheduleId]
            );
            
            if (verifyRows.length > 0) {
                console.log('✅ 驗證成功：資料已儲存到資料庫');
                console.log('✅ 驗證資料:', verifyRows[0]);
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
            tripId: tripId,
            transportTimes: transportTimes,
            apiResults: travelTimeResults
        };

    } catch (error) {
        console.error('💥 計算過程發生錯誤:', error);
        return {
            success: false,
            error: error.message,
            fromAId: fromAId,
            toAId: toAId,
            scheduleId: scheduleId,
            tripId: tripId
        };
    } finally {
        // 確保關閉資料庫連接
        if (connection) {
            try {
                await connection.end();
                console.log('🔒 資料庫連接已關閉');
            } catch (closeError) {
                console.error('⚠️ 關閉資料庫連接時發生錯誤:', closeError);
            }
        }
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
 * @param {number} scheduleId - 行程ID（可選）
 * @returns {Object|null} 交通時間資料
 */
export async function getTransportTime(fromAId, toAId, scheduleId = null) {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '20250101',
            database: 'travel'
        });

        let query, params;
        if (scheduleId) {
            query = 'SELECT * FROM transport_time WHERE from_a_id = ? AND to_a_id = ? AND s_id = ?';
            params = [fromAId, toAId, scheduleId];
        } else {
            query = 'SELECT * FROM transport_time WHERE from_a_id = ? AND to_a_id = ?';
            params = [fromAId, toAId];
        }

        const [rows] = await connection.execute(query, params);

        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        console.error('獲取交通時間時發生錯誤:', error);
        return null;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}