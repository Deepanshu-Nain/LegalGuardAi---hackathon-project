const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Mock user database
const users = [
  { email: 'user@example.com', password: 'password123' },
  { email: 'admin@example.com', password: 'admin123' }
];

// Login endpoint
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  const user = users.find(u => u.email === email && u.password === password);

  if (user) {
    res.json({ success: true, message: 'Login successful', user: { email: user.email } });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// Signup endpoint
app.post('/api/signup', (req, res) => {
  const { email, password } = req.body;

  const existingUser = users.find(u => u.email === email);

  if (existingUser) {
    res.status(400).json({ success: false, message: 'User already exists' });
  } else {
    users.push({ email, password });
    res.json({ success: true, message: 'Signup successful', user: { email } });
  }
});

// Logout endpoint (for completeness)
app.post('/api/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});