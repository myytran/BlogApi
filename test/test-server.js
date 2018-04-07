'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker'); //npm i faker [install]
const mongoose = require('mongoose');


const expect = chai.expect;
const should = chai.should();
const {app, runServer, closeServer}= require('../server'); //import server.js the functions that are needed to be invoked here.
const {newBlog} = require('../models'); //import newBlog schema from models.js folder
const {TEST_DATABASE_URL} = require('../config'); //imports TEST_DATABASE_URL from the config folder

chai.use(chaiHttp);

//functions for test process
function seedBlogData() {
  console.info('seeding blog data');
  const seedData = [];

  for (let i=1; i<=10; i++) {
    seedData.push({
      author: {
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName()
      },
      title: faker.lorem.sentence(),
      content: faker.lorem.text()
    });
  }
  // this will return a promise
  return newBlog.insertMany(seedData);
}

//this function tears down the dataase and we'll put it in the afterEach function
function tearDownDb() {
  return new Promise((resolve, reject) => {
    console.warn('Deleting database');
    mongoose.connection.dropDatabase()
      .then(result => resolve(result))
      .catch(err => reject(err));
  });
}



describe('A blog API resource', function() {
//hook functions that return a Promise
  before(function() {
    //returns the TEST_DATABASE_URL to run these tests, setting up test environment
    return runServer(TEST_DATABASE_URL);
  });
//seed data with seedBlogData function before each function
  beforeEach(function() {
    return seedBlogData();
  });
  //tears down Database after each tests are ran
  afterEach(function() {
    return tearDownDb();
  });
  //after each function, return closeServer to shut down server
  after(function() {
    return closeServer();
  });

  //second nested describe block
describe ('GET endpoint', function() {

it('should return all existing blogs', function(){
  let res;
  return chai.request(app)
    .get('/posts')
    .then(function(_res) {
      // so subsequent .then blocks can access response object
      res = _res;
      //response should have correct status code
      res.should.have.status(200);
      res.body.should.have.lengthOf.at.least(1);
      // otherwise our db seeding didn't work
      return newBlog.count();
    })
    //no.3; proving number of posts equal to number in db
    .then(count => {
      res.body.should.have.lengthOf(count);

    });
  });
  it('should return posts with right fields', function() {
    let resPost;
    return chai.request(app)
    .get('/posts')
    .then(function(res) {
      res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('array');
          res.body.should.have.lengthOf.at.least(1);

          res.body.forEach(function (post) {
            post.should.be.a('object');
            post.should.include.keys('id', 'title', 'content', 'author', 'created');
          });
          resPost = res.body[0];
          return newBlog.findById(resPost.id);
    })
    .then(post => {
          resPost.title.should.equal(post.title);
          resPost.content.should.equal(post.content);
          resPost.author.should.equal(post.authorName);
  });
    });
  }); //end of second nested describe GET function
  describe('POST endpoint', function () {
      // strategy: make a POST request with data,
      // then prove that the post we get back has
      // right keys, and that `id` is there (which means
      // the data was inserted into db)
      it('should add a new blog post', function () {

        const newPost = {
          title: faker.lorem.sentence(),
          author: {
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName(),
          },
          content: faker.lorem.text()
        };
        return chai.request(app)
               .post('/posts')
               .send(newPost)
               .then(function (res) {
                 res.should.have.status(201);
                 res.should.be.json;
                 res.body.should.be.a('object');
                 res.body.should.include.keys(
                   'id', 'title', 'content', 'author', 'created');
                 res.body.title.should.equal(newPost.title);
                 // cause Mongo should have created id on insertion
                 res.body.id.should.not.be.null;
                 res.body.author.should.equal(
                   `${newPost.author.firstName} ${newPost.author.lastName}`);
                 res.body.content.should.equal(newPost.content);
                 return newBlog.findById(res.body.id);
               })
               .then(function (post) {
                 post.title.should.equal(newPost.title);
                 post.content.should.equal(newPost.content);
                 post.author.firstName.should.equal(newPost.author.firstName);
                 post.author.lastName.should.equal(newPost.author.lastName);
               });
           });
         });
         describe('PUT endpoint', function () {

           // strategy:
           //  1. Get an existing post from db
           //  2. Make a PUT request to update that post
           //  4. Prove post in db is correctly updated
           it('should update fields you send over', function () {
             const updateData = {
               title: 'cats cats cats',
               content: 'dogs dogs dogs',
               author: {
                 firstName: 'foo',
                 lastName: 'bar'
               }
             };
             return newBlog
               .findOne()
               .then(post => {
                 updateData.id = post.id;

                 return chai.request(app)
                   .put(`/posts/${post.id}`)
                   .send(updateData);
               })
               .then(res => {
                 res.should.have.status(204);
                 return newBlog .findById(updateData.id);
               })
               .then(post => {
                 post.title.should.equal(updateData.title);
                 post.content.should.equal(updateData.content);
                 post.author.firstName.should.equal(updateData.author.firstName);
                 post.author.lastName.should.equal(updateData.author.lastName);
               });
           });
         });
         describe('DELETE endpoint', function () {
    // strategy:
    //  1. get a post
    //  2. make a DELETE request for that post's id
    //  3. assert that response has right status code
    //  4. prove that post with the id doesn't exist in db anymore
    it('should delete a post by id', function () {

      let post;

      return newBlog

        .findOne()
        .then(_post => {
          post = _post;
          return chai.request(app).delete(`/posts/${post.id}`);
        })
        .then(res => {
          res.should.have.status(204);
          return newBlog.findById(post.id);
        })
        .then(_post => {
          // when a variable's value is null, chaining `should`
          // doesn't work. so `_post.should.be.null` would raise
          // an error. `should.be.null(_post)` is how we can
          // make assertions about a null value.
          should.not.exist(_post);
        });
    });
  });

}); //end of first describe block function
