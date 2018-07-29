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
  privateDocs: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document'
    }
  ],
  sharedDocs: [
    {
      type: Schema.ObjectId,
      ref: 'Document'
    }
  ]
});

UserSchema.statics.findOrCreate = function(username, password, callback) {
  User.findOne({ username })
    .then(user => {
      if (!user) {
        User.create({
          username,
          password
        })
          .then(resp => callback(null, resp)) // register
          .catch(err => callback(err, null)); // error
      } else if (password !== user.password) {
        // invalid password entered by user
        callback('Passwords do not match', null);
      } else {
        //authentication successful. pass user to client
        callback(null, user);
      }
    })
    .catch(err => callback(err, null));
};

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
