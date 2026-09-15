require('dotenv').config();
const express = require('express');
const connectDB = require('./dbConnect');
const User = require('./models/User');

const app = express();
app.use(express.json());

connectDB();

app.get('/', (req, res) => {
  res.send('Admin Microservice is running');
});

app.get('/admin/searchuser', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: 'query parameter is required' });
    }

    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { emailid: { $regex: query, $options: 'i' } },
      ],
    }).select('-pass');

    if (users.length === 0) {
      return res.status(404).json({ message: 'No user found' });
    }

    res.status(200).json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.get('/admin/viewalluser', async (req, res) => {
  try {
    const users = await User.find().select('-pass');
    res.status(200).json({ count: users.length, users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.delete('/admin/deluser', async (req, res) => {
  try {
    const { emailid } = req.body;
    if (!emailid) {
      return res.status(400).json({ message: 'emailid is required' });
    }

    const deletedUser = await User.findOneAndDelete({ emailid });
    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User deleted successfully', emailid });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

const PORT = process.env.PORT || 5003;
app.listen(PORT, () => {
  console.log(`Admin service running on port ${PORT}`);
});