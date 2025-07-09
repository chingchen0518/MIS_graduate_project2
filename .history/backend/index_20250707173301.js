import Teacher from './models/teacher.js';
import Student from './models/students.js';
import Abcd from './models/abcd.js';

import Attraction from './models/attraction.js';
import Business from './models/business.js';
import Evaluate from './models/evaluate.js';
import Include2 from './models/include2.js';
import Join from './models/join.js';
import Schedule from './models/schedule.js';
import Support from './models/support.js';
import Trip from './models/trip.js';
import User from './models/user.js';
import Weekday from './models/Weekday.js'

// 這裡可設定關聯（如有）
/*
// Example: 一個老師有多個學生
Teacher.hasMany(Student, { foreignKey: 'teacherId' });
Student.belongsTo(Teacher, { foreignKey: 'teacherId' });
*/

export {
  Teacher,
  Student,
  Abcd,
};