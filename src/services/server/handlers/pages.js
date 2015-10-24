/**
 * Module dependencies.
 */

var pages = require('../../../sources/pages');

/*
 * Export the pages route handlers.
 */

var handlers = exports = module.exports = {};

/*
 * Render the index page.
 */

handlers.index = function(req, res){
    res.render('index', {
        section: {
            handle: 'home'
        }
    });
};

/*
 * Render a generic page.
 */

handlers.page = function(req, res){

    res.send('page');
};