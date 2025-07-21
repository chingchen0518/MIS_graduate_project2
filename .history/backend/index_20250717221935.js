import Attraction from './models/attraction.js';
import Business from './models/business.js';
import Evaluate from './models/evaluate.js';
import Include2 from './models/include2.js';
import Join from './models/join.js';
import Schedule from './models/schedule.js';
import Support from './models/support.js';
import Trip from './models/trip.js';
import User from './models/user.js';
import Weekday from './models/weekday.js';
import Hotel from './models/hotel.js';
import TripHotel from './models/tripHotel.js';


Trip.hasMany(Attraction, { foreignKey: 't_id' });
Attraction.belongsTo(Trip, { foreignKey: 't_id' });

User.hasMany(Trip, { foreignKey: 'u_id' });
Trip.belongsTo(User, { foreignKey: 'u_id' });

User.hasMany(Attraction, { foreignKey: 'u_id' });
Attraction.belongsTo(User, { foreignKey: 'u_id' });

User.hasMany(Schedule, { foreignKey: 'u_id' });
Schedule.belongsTo(User, { foreignKey: 'u_id' });

Attraction.belongsToMany(Weekday, { through: Business, foreignKey: 'a_id', otherKey: 'w_day' });
Weekday.belongsToMany(Attraction, { through: Business, foreignKey: 'w_day', otherKey: 'a_id' });

Trip.hasMany(Schedule, { foreignKey: 't_id' });
Schedule.belongsTo(Trip, { foreignKey: 't_id' });

Schedule.belongsToMany(Attraction, { through: Include2, foreignKey: 's_id', otherKey: 'a_id' });
Attraction.belongsToMany(Schedule, { through: Include2, foreignKey: 'a_id', otherKey: 's_id' });

User.belongsToMany(Trip, { through: Join, foreignKey: 'u_id', otherKey: 't_id' });
Trip.belongsToMany(User, { through: Join, foreignKey: 't_id', otherKey: 'u_id' });

User.belongsToMany(Attraction, { through: Support, foreignKey: 'u_id', otherKey: 'a_id' });
Attraction.belongsToMany(User, { through: Support, foreignKey: 'a_id', otherKey: 'u_id' });

User.belongsToMany(Schedule, { through: Evaluate, foreignKey: 'u_id', otherKey: 's_id' });
Schedule.belongsToMany(User, { through: Evaluate, foreignKey: 's_id', otherKey: 'u_id' });

Hotel.belongsToMany(Trip, { through: TripHotel, foreignKey: 'h_id', otherKey: 't_id' });
Trip.belongsToMany(Hotel, { through: TripHotel, foreignKey: 't_id', otherKey: 'h_id' });


export {
  Attraction,
  Business,
  Evaluate,
  Include2,
  Join,
  Schedule,
  Support,
  Trip,
  User,
  Weekday,
  Hotel,
};