'use strict';

const express = require('express');
const mongoose = require('mongoose'); //import Mongoose
const bodyParser = require('body-parser');



mongoose.Promise = global.Promise;//sets Mongoose to use ES6 promises

const { DATABASE_URL, PORT } = require('./config');
const {newBlog} = require('./models'); //now that we have a database for newBlog, we can import model.js that contains newBlog schema!
const app = express();
const morgan = require('morgan');

app.use(morgan('common'));
app.use(bodyParser.json());





//get posts to /posts endpoint
app.get('/posts', (req, res) => {
   newBlog
   .find()
   .then(posts => {
      res.json(posts.map(post => post.serialize()));
    })
    .catch(err => { //if endpoint fails then console error with 500 msg
        console.error(err);
        res.status(500).json({message: 'Internal server error'})
    });
});

//get posts by ID
app.get('/posts/:id', (req,res) => {
  newBlog
  .findById(req.params.id)
  .then(post => res.json(post.serialize()))
  .catch(err => { //if endpoint fails then console error with 500 msg
      console.error(err);
      res.status(500).json({message: 'Internal server error'})
  });
});

//CREATING posts: ensures that required fields for creating new instances have been supplied
app.post('/posts', (req, res) => {

  const requiredFields = ['title', 'author', 'content'];
  for (let i = 0; i < requiredFields.length; i++) {
    const field = requiredFields[i];
    if (!(field in req.body)) {
      const message = `Missing \`${field}\` in request body`;
      console.error(message);
      return res.status(400).send(message);
    }
  }

//model CREATE for newBlog posts
newBlog
  .create({
    title: req.body.title,
    author: req.body.author,
    content: req.body.content
  })
  .then(newBlog => res.status(201).json(newBlog.serialize()))
  .catch(err => { //if endpoint fails then console error with 500 msg
      console.error(err);
      res.status(500).json({message: 'Internal server error'})
  });
});

//UPDATE operations by ID
app.put('/posts/:id', (req, res) => {
  // ensure that the id in the request path and the one in request body match
  if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
    const message = (
      `Request path id (${req.params.id}) and request body id ` +
      `(${req.body.id}) must match`);
    console.error(message);
    return res.status(400).json({ message: message });
  }

  // we only support a subset of fields being updateable.
  // if the user sent over any of the updatableFields, we udpate those values
  // in document
  const toUpdate = {};
  const updateableFields = ['title', 'author', 'content'];

  updateableFields.forEach(field => {
    if (field in req.body) {
      toUpdate[field] = req.body[field];
    }
  });

  newBlog
    // all key/value pairs in toUpdate will be updated -- that's what `$set` does
    .findByIdAndUpdate(req.params.id, { $set: toUpdate })
    .then(restaurant => res.status(204).end())
    .catch(err => res.status(500).json({ message: 'Internal server error' }));
});

//DELETE operations:
app.delete('/posts/:id', (req, res) => {
  newBlog
    .findByIdAndRemove(req.params.id)
    .then(newBlog => res.status(204).end())
    .catch(err => res.status(500).json({ message: 'Internal server error' }));
});

//CATCH ALL endpoint to respond a 404 to any other endpoints
app.use('*', function (req, res) {
  res.status(404).json({ message: 'Not Found' });
});


let server;
// this function connects to our database, then starts the server
function runServer(DATABASE_URL, port = PORT) {

  return new Promise((resolve, reject) => {
    mongoose.connect(DATABASE_URL, err => {
      if (err) {
        return reject(err);
      }
      server = app.listen(port, () => {
        console.log(`Your app is listening on port ${port}`);
        resolve();
      })
        .on('error', err => {
          mongoose.disconnect();
          reject(err);
        });
    });
  });
}

// this function closes the server, and returns a promise. we'll
// use it in our integration tests later.
function closeServer() {
  return mongoose.disconnect().then(() => {
    return new Promise((resolve, reject) => {
      console.log('Closing server');
      server.close(err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  });
}

// if server.js is called directly (aka, with `node server.js`), this block
// runs. but we also export the runServer command so other code (for instance, test code) can start the server as needed.
if (require.main === module) {
  runServer(DATABASE_URL).catch(err => console.error(err));
}

module.exports = { app, runServer, closeServer };
