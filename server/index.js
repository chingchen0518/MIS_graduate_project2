const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
const registerRouter = require('./routes/register');

app.use(express.json());
app.use('/api/register', registerRouter);

// 可選：提供根目錄測試訊息
app.get('/', (req, res) => {
    res.send('API Server is running.');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});