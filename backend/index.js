import Teacher from './models/teacher.js';
import Student from './models/students.js';
import Abcd from './models/abcd.js';

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