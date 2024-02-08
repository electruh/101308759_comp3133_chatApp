const mongoose = require('mongoose');

const UserSchema = mongoose.Schema({
  
    username:{
    type: String,
    required: [true, 'Please enter username'],
    lowercase: true,
    unique: true
  },
  firstname: {
    type: String,
    lowercase: true
  },
  lastname: {
    type: String,
    lowercase: true
  },
  password:{
    type: String,
    required: [true, 'Please enter password'],
    minlength:5
  },
  createon: {
    type: Date,
    default: Date.now,
  },
});

UserSchema.post('init', (doc) => {
  console.log('%s has been initialized from the db', doc._id);
});

UserSchema.post('validate', (doc) => {
  console.log('%s has been validated (but not saved yet)', doc._id);
});

UserSchema.post('save', (doc) => {
  console.log('%s has been saved', doc._id);
});

UserSchema.post('remove', (doc) => {
  console.log('%s has been removed', doc._id);
});

module.exports = mongoose.model('User',UserSchema);