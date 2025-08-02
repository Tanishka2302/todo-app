const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = 3001;

// PostgreSQL connection setup
const pool = new Pool({
  user: 'todo_user',
  host: 'localhost',
  database: 'todo_app',
  password: 'secure123',  // 🔁 Replace with your password
  port: 5432,
});

// Create table if not exists (on server start)
const createTableQuery = `
  CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

pool.query(createTableQuery)
  .then(() => console.log('✅ Tasks table is ready'))
  .catch(err => console.error('❌ Failed to create tasks table:', err.message));

app.use(cors());
app.use(express.json());

// GET all tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tasks ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST a new task
app.post('/api/tasks', async (req, res) => {
  const { text } = req.body;
  if (!text || text.trim() === '') {
    return res.status(400).json({ error: 'Task text is required' });
  }

  const cleanText = text.trim();
  try {
    const result = await pool.query(
      'INSERT INTO tasks (text) VALUES ($1) RETURNING *',
      [cleanText]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Insert error:', err.message);
    res.status(500).json({ error: 'Database error' });
  }
});

// DELETE a task
app.delete('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error('❌ Delete error:', err.message);
    res.status(500).json({ error: 'Database error' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
