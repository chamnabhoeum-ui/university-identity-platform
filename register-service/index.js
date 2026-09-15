require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const connectDB = require('./dbConnect');
const User = require('./models/User');

const app = express();
app.use(express.json());

connectDB();

app.get('/', (req, res) => {
  res.send('Registration Microservice is running');
});

app.post('/register/userregister', async (req, res) => {
  try {
    const { id, name, emailid, pass, mobile, role } = req.body;

    if (!name || !emailid || !pass) {
      return res.status(400).json({ message: 'Name, emailid and pass are required' });
    }

    const existingUser = await User.findOne({ emailid });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists with this emailid' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(pass, salt);

    const newUser = new User({ id, name, emailid, pass: hashedPassword, mobile, role });
    await newUser.save();

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser._id,
        name: newUser.name,
        emailid: newUser.emailid,
        mobile: newUser.mobile,
        role: newUser.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Registration service running on port ${PORT}`);
});