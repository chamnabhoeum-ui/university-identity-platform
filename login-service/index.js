require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const connectDB = require('./dbConnect');
const User = require('./models/User');

const app = express();
app.use(express.json());

connectDB();

app.get('/', (req, res) => {
  res.send('Login Microservice is running');
});

app.post('/auth/login', async (req, res) => {
  try {
    const { emailid, pass, role } = req.body;

    if (!emailid || !pass || !role) {
      return res.status(400).json({ message: 'emailid, pass and role are required' });
    }

    const user = await User.findOne({ emailid });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.role !== role) {
      return res.status(401).json({ message: 'Invalid role' });
    }

    const isMatch = await bcrypt.compare(pass, user.pass);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user._id, emailid: user.emailid, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({ message: 'Login successful', token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`Login service running on port ${PORT}`);
});