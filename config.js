'use strict';

exports.DATABASE_URL = process.env.DATABASE_URL ||  'mongodb://localhost/bloggingapp'; //add the hardcoded name we gave to database on Mlab
exports.PORT = process.env.PORT || 8080;
