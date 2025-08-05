// 引入簡化的計算函數
import { simpleCalculate } from './MapTest.js';

// 定義景點和日期
const zurich = { name: '蘇黎世', coords: [47.3769, 8.5417] };
const luzern = { name: '琉森', coords: [47.0502, 8.3093] };
const date = '2024-07-15';

// 執行計算
simpleCalculate(zurich, luzern, date);
