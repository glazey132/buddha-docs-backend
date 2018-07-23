const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  }
});

const DocSchema = new mongoose.Schema({
  title: {
    type: String,
    default: 'untitled'
  },
  password: {
    type: String,
    required: true
  },
  createdAt: {
    type: Number,
    default: new Date().getTime()
  },
  contents: {
    // most recent state
    type: String,
    default: ''
  },
  last_edit: {
    type: Number,
    default: new Date().getTime() // updates on doc save
  },
  collaborators: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  revision_history: {
    type: Array,
    default: [] //updates on doc save
  }
});

const User = mongoose.model('User', UserSchema);
const Doc = mongoose.model('Document', DocSchema);
