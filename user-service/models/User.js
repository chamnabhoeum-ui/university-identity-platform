const schema_mongoose = require('mongoose');

const PersonSchema = new schema_mongoose.Schema(
  {
    id: { type: Number },
    name: { type: String, required: true },
    emailid: { type: String, required: true, unique: true, lowercase: true, trim: true },
    pass: { type: String, required: true },
    mobile: { type: Number },
    role: { type: String, required: true, enum: ['user', 'admin'], default: 'user' },
  },
  {
    timestamps: true,
  }
);

module.exports = schema_mongoose.model('person_collection', PersonSchema);