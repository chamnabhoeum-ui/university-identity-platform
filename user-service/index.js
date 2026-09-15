require('dotenv').config();
const express = require('express');
const connectDB = require('./dbConnect');
const User = require('./models/User');

const app = express();
app.use(express.json());

connectDB();

app.get('/', (req, res) => {
  res.send('User Microservice is running');
});

// GET /user/viewprofile
// The API Gateway decodes the caller's JWT and forwards their identity
// via the x-user-emailid header, so a user can only ever see their OWN profile.
app.get('/user/viewprofile', async (req, res) => {
  try {
    const emailid = req.headers['x-user-emailid'];
    if (!emailid) {
      return res.status(401).json({ message: 'Missing user identity from gateway' });
    }

    const user = await User.findOne({ emailid }).select('-pass');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /user/updateprofile   body: { "name": "...", "mobile": "..." }
app.put('/user/updateprofile', async (req, res) => {
  try {
    const emailid = req.headers['x-user-emailid'];
    if (!emailid) {
      return res.status(401).json({ message: 'Missing user identity from gateway' });
    }

    const { name, mobile } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (mobile) updates.mobile = mobile;

    const updatedUser = await User.findOneAndUpdate(
      { emailid },
      { $set: updates },
      { new: true }
    ).select('-pass');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

const PORT = process.env.PORT || 5004;
app.listen(PORT, () => {
  console.log(`User service running on port ${PORT}`);
});
