import { routeService } from '../Liu/mapAddRoute/services/RouteCalculationService.js';

var zurich={ name: '蘇黎世', coords: [47.3769, 8.5417] };
var luzern={ name: '琉森', coords: [47.0502, 8.3093] };

const date = '2024-07-15';

// var walk = routeService.calculateRoute(zurich.coords, luzern.coords, date, 'WALK')
// var bicycle = routeService.calculateRoute(zurich.coords, luzern.coords, date, 'BICYCLE')


// =============預期結果=============
// walk:30 minutes
// bicycle: 15 minutes
// car: 10 minutes
// public transport: 25 minutes
