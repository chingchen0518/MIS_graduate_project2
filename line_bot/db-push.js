import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '20250101',
  database: 'travel'
});

export async function getTripsToPush() {
  const [rows] = await connection.execute(
    `SELECT * FROM trip`
  );
  return rows;
}


export async function getUserLineId(u_id) {
  const [rows] = await connection.execute(
    `SELECT u_lineid FROM User WHERE id = ?`,
    [u_id]
  );
  return rows[0]?.u_lineid || null;
}
