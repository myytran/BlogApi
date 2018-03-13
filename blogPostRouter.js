const express = require('express');
const router = express.router();
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();


const {blogPostRouter}= require('./models'); //? ask for clarification


function blogPost() {
  return 'Frizzy the cat has' + 'mutiple personalities' + 'and one of which inclines him to steal other cats squeaky balls'
  }




blogPostRouter.create('Rory and I adopted Frizzy the cat', blogPost(), 3 );
blogPostRouter.create('Sadira and friends came over for dinner', blogPost(), 5);

router.get('/', (req, res) => {
  res.json(blogPostRouter.get());
});

//Endpoint for GET requests, line 23 also calls blogPostRouter function to return JSON objects of blog posts.
router.get('/', (req, res) => {
  res.json(blogPostRouter.get());
});


//endpoint for posting new blogs. Sets required fields for what should be included in body of blog post.
router.post('/', jsonParser, (req, res) => {

  const requiredFields = ['title', 'author', 'content'];
  for (let i=0; i<requiredFields.length; i++) {
    const field = requiredFields[i];
    if (!(field in req.body)) {
      const message = `Missing \`${field}\` in request body`
      console.error(message);
      return res.status(400).send(message);
    }
  }

  const item = blogPostRouter.create(req.body.title, req.body.author,req.body.content);
  res.status(201).json(item);
});

//endpoint for PUT requests
router.put('/', jsonParser, (req, res) => {
  const requiredFields = ['title', 'author', 'content'];
  for (let i=0; i<requiredFields.length; i++) {
    const field = requiredFields[i];
    if (!(field in req.body)) {
      const message = `Missing \`${field}\` in request body`
      console.error(message);
      return res.status(400).send(message);
    }
  }

  if (req.params.id !== req.body.id) {
    const message = `Request path id (${req.params.id}) and request body id (${req.body.id}) must match`;
    console.error(message);
    return res.status(400).send(message);
  }
  console.log(`Updating blog post with id \`${req.params.id}\``);
  blogPostRouter.update({
    id: req.params.id,
    title: req.body.title,
    author: req.body.author,
    content: req.body.content
  });
  res.status(204).end();
});

//endpoint for DELETE
router.delete('/', (req, res) => {
  blogPostRouter.delete(req.params.id);
  console.log(`Deleted blog with id \`${req.params.ID}\``);
  res.status(204).end();
});

module.exports = router;
