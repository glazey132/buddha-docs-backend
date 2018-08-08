const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  docList: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document'
    }
  ]
});

const DocSchema = mongoose.Schema({
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
  collaborators: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  revision_history: {
    type: Array,
    default: [] //updates on doc save
  }
});

const User = mongoose.model('User', UserSchema);
const Document = mongoose.model('Document', DocSchema);

module.exports = {
  User,
  Document
};
