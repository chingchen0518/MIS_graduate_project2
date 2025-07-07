import { useState, useEffect } from 'react'
import axios from 'axios'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [data, setData] = useState({
    users: [],
    trips: [],
    schedules: [],
    attractions: [],
    weekdays: [],
    joins: [],
    include2: [],
    evaluates: [],
    supports: [],
    businesses: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchAll() {
      try {
        const [
          usersRes,
          tripsRes,
          schedulesRes,
          attractionsRes,
          weekdaysRes,
          joinsRes,
          include2Res,
          evaluatesRes,
          supportsRes,
          businessesRes,
        ] = await Promise.all([
          axios.get('http://localhost:3001/api/users'),
          axios.get('http://localhost:3001/api/trips'),
          axios.get('http://localhost:3001/api/schedules'),
          axios.get('http://localhost:3001/api/attractions'),
          axios.get('http://localhost:3001/api/weekdays'),
          axios.get('http://localhost:3001/api/joins'),
          axios.get('http://localhost:3001/api/include2'),
          axios.get('http://localhost:3001/api/evaluates'),
          axios.get('http://localhost:3001/api/supports'),
          axios.get('http://localhost:3001/api/businesses'),
        ])

        setData({
          users: usersRes.data,
          trips: tripsRes.data,
          schedules: schedulesRes.data,
          attractions: attractionsRes.data,
          weekdays: weekdaysRes.data,
          joins: joinsRes.data,
          include2: include2Res.data,
          evaluates: evaluatesRes.data,
          supports: supportsRes.data,
          businesses: businessesRes.data,
        })
      } catch (err) {
        setError(err.message || '讀取資料時發生錯誤')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  if (loading) return <div>讀取中...</div>
  if (error) return <div>錯誤：{error}</div>

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React 顯示所有資料表</h1>

      <h2>Users</h2>
      <pre>{JSON.stringify(data.users, null, 2)}</pre>

      <h2>Trips</h2>
      <pre>{JSON.stringify(data.trips, null, 2)}</pre>

      <h2>Schedules</h2>
      <pre>{JSON.stringify(data.schedules, null, 2)}</pre>

      <h2>Attractions</h2>
      <pre>{JSON.stringify(data.attractions, null, 2)}</pre>

      <h2>Weekdays</h2>
      <pre>{JSON.stringify(data.weekdays, null, 2)}</pre>

      <h2>Joins</h2>
      <pre>{JSON.stringify(data.joins, null, 2)}</pre>

      <h2>Include2</h2>
      <pre>{JSON.stringify(data.include2, null, 2)}</pre>

      <h2>Evaluates</h2>
      <pre>{JSON.stringify(data.evaluates, null, 2)}</pre>

      <h2>Supports</h2>
      <pre>{JSON.stringify(data.supports, null, 2)}</pre>

      <h2>Businesses</h2>
      <pre>{JSON.stringify(data.businesses, null, 2)}</pre>
    </>
  )
}

export default App
