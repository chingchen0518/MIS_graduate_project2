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
import Weekday from './models/weekday.js';


// Trip 與 Attraction（一對多）
Trip.hasMany(Attraction, { foreignKey: 't_id' });
Attraction.belongsTo(Trip, { foreignKey: 't_id' });

// User 與 Trip（一對多）
User.hasMany(Trip, { foreignKey: 'u_id' });
Trip.belongsTo(User, { foreignKey: 'u_id' });

// User 與 Attraction（一對多）
User.hasMany(Attraction, { foreignKey: 'u_id' });
Attraction.belongsTo(User, { foreignKey: 'u_id' });

// User 與 Schedule（一對多）
User.hasMany(Schedule, { foreignKey: 'u_id' });
Schedule.belongsTo(User, { foreignKey: 'u_id' });

// Attraction 與 Weekday 透過 Business (多對多)
Attraction.belongsToMany(Weekday, { through: Business, foreignKey: 'a_id', otherKey: 'w_day' });
Weekday.belongsToMany(Attraction, { through: Business, foreignKey: 'w_day', otherKey: 'a_id' });

// Schedule 與 Trip（一對多）
Trip.hasMany(Schedule, { foreignKey: 't_id' });
Schedule.belongsTo(Trip, { foreignKey: 't_id' });

// Schedule 與 Attraction 透過 Include2 (多對多)
Schedule.belongsToMany(Attraction, { through: Include2, foreignKey: 's_id', otherKey: 'a_id' });
Attraction.belongsToMany(Schedule, { through: Include2, foreignKey: 'a_id', otherKey: 's_id' });

// User 與 Trip 透過 Join (多對多)
User.belongsToMany(Trip, { through: Join, foreignKey: 'u_id', otherKey: 't_id' });
Trip.belongsToMany(User, { through: Join, foreignKey: 't_id', otherKey: 'u_id' });

// User 與 Attraction 透過 Support (多對多)
User.belongsToMany(Attraction, { through: Support, foreignKey: 'u_id', otherKey: 'a_id' });
Attraction.belongsToMany(User, { through: Support, foreignKey: 'a_id', otherKey: 'u_id' });

// User 與 Schedule 透過 Evaluate（多對多）
User.belongsToMany(Schedule, { through: Evaluate, foreignKey: 'u_id', otherKey: 's_id' });
Schedule.belongsToMany(User, { through: Evaluate, foreignKey: 's_id', otherKey: 'u_id' });


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
};