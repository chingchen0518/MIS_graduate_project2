import { routeService } from './services/RouteCalculationService.js';

// 修正變數宣告語法
const zurich = { name: '蘇黎世', coords: [47.3769, 8.5417] };
const luzern = { name: '琉森', coords: [47.0502, 8.3093] };

const date = '2024-07-15';

// 計算交通時間的主要函數 - 修改為接受參數
async function calculateTravelTime(fromLocation, toLocation, travelDate) {
    try {
        console.log('開始計算交通時間...');
        
        // 使用 routeService 計算所有交通方式的路線
        const routes = await routeService.calculateAllRoutes(
            fromLocation.coords, 
            toLocation.coords, 
            travelDate
        );
        
        console.log('計算結果:', routes);
        
        // 解析每種交通方式的時間
        const results = {};
        
        for (const [transportType, routeData] of Object.entries(routes)) {
            if (routeData && routeData.plan && routeData.plan.itineraries && routeData.plan.itineraries.length > 0) {
                const itinerary = routeData.plan.itineraries[0];
                const durationMinutes = Math.round(itinerary.duration / 60);
                const distanceKm = (itinerary.walkDistance / 1000).toFixed(2);
                
                results[transportType] = {
                    duration: durationMinutes,
                    distance: distanceKm,
                    startTime: new Date(itinerary.startTime).toLocaleTimeString(),
                    endTime: new Date(itinerary.endTime).toLocaleTimeString()
                };
                
                console.log(`${transportType}: ${durationMinutes} 分鐘, ${distanceKm} 公里`);
            } else {
                results[transportType] = { error: '無法找到路線' };
                console.log(`${transportType}: 無法找到路線`);
            }
        }
        
        return results;
        
    } catch (error) {
        console.error('計算交通時間時發生錯誤:', error);
        return null;
    }
}

// 計算單一交通方式的函數
async function calculateSingleRoute(fromLocation, toLocation, travelDate, mode = 'WALK') {
    try {
        console.log(`計算 ${mode} 路線...`);
        
        const route = await routeService.calculateRoute(
            fromLocation.coords,
            toLocation.coords, 
            travelDate,
            mode
        );
        
        if (route && route.plan && route.plan.itineraries && route.plan.itineraries.length > 0) {
            const itinerary = route.plan.itineraries[0];
            const durationMinutes = Math.round(itinerary.duration / 60);
            const distanceKm = (itinerary.walkDistance / 1000).toFixed(2);
            
            console.log(`${mode} 路線詳情:`);
            console.log(`- 時間: ${durationMinutes} 分鐘`);
            console.log(`- 距離: ${distanceKm} 公里`);
            console.log(`- 出發時間: ${new Date(itinerary.startTime).toLocaleTimeString()}`);
            console.log(`- 到達時間: ${new Date(itinerary.endTime).toLocaleTimeString()}`);
            
            return {
                duration: durationMinutes,
                distance: distanceKm,
                startTime: new Date(itinerary.startTime).toLocaleTimeString(),
                endTime: new Date(itinerary.endTime).toLocaleTimeString(),
                legs: itinerary.legs
            };
        } else {
            console.log(`${mode}: 無法找到路線`);
            return { error: '無法找到路線' };
        }
        
    } catch (error) {
        console.error(`計算 ${mode} 路線時發生錯誤:`, error);
        return { error: error.message };
    }
}

// 簡化的 API 調用函數 - 只需要傳入基本參數
async function simpleCalculate(fromLocation, toLocation, date) {
    console.log(`計算 ${fromLocation.name} → ${toLocation.name} (${date})`);
    
    try {
        const result = await calculateTravelTime(fromLocation, toLocation, date);
        
        // 簡化輸出格式
        if (result) {
            console.log('計算完成:');
            for (const [type, data] of Object.entries(result)) {
                if (data.error) {
                    console.log(`${type}: ${data.error}`);
                } else {
                    console.log(`${type}: ${data.duration} 分鐘, ${data.distance} 公里`);
                }
            }
            return result;
        } else {
            console.log('計算失敗');
            return null;
        }
    } catch (error) {
        console.error('錯誤:', error.message);
        return null;
    }
}

// 導出函數供其他檔案使用
export { calculateTravelTime, calculateSingleRoute, simpleCalculate };

// 如果直接執行這個檔案，則運行測試
if (import.meta.url === `file://${process.argv[1]}`) {
    // 執行計算
    console.log(`準備計算 ${zurich.name} 到 ${luzern.name} 的交通時間`);

    // 方法一：計算所有交通方式
    calculateTravelTime(zurich, luzern, date).then(results => {
        console.log('所有交通方式計算完成:', results);
    });

    // 方法二：只計算步行路線
    // calculateSingleRoute(zurich, luzern, date, 'WALK').then(result => {
    //     console.log('步行路線計算完成:', result);
    // });

    // 方法三：只計算汽車路線
    // calculateSingleRoute(zurich, luzern, date, 'CAR').then(result => {
    //     console.log('汽車路線計算完成:', result);
    // });

    // 方法四：只計算大眾運輸路線
    // calculateSingleRoute(zurich, luzern, date, 'TRANSIT,WALK').then(result => {
    //     console.log('大眾運輸路線計算完成:', result);
    // });

    // 簡化的計算示範
    simpleCalculate(zurich, luzern, date);
}
