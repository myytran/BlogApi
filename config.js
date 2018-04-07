'use strict';

exports.DATABASE_URL = process.env.DATABASE_URL ||  'mongodb://localhost/bloggingapp'; //add the hardcoded name we gave to database on Mlab
exports.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL|| 'mongodb://localhost/test-bloggingapp';
exports.PORT = process.env.PORT || 8081;
