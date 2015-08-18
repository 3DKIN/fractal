var promise = require("bluebird");
var merge   = require("deepmerge");
var _       = require("lodash");
var express = require('express');
var exphbs  = require('express-handlebars');
var path    = require('path');
var swag    = require('swag');
var fractal = require('../../fractal');

var config  = fractal.getConfig();

module.exports = function(){

    var port = config.get('port');
    var app = express();
    var hbs = exphbs.create({
        extname: 'hbs',
        partialsDir: [
            config.get('theme.views')
        ],
        helpers: {
            nav: navHelper,
        }
    });

    swag.registerHelpers(hbs.handlebars);

    var tplData = {
        config: config.all(),
    };

    app.engine('hbs', hbs.engine);
    app.set('views', config.get('theme.views'))
    app.set('view engine', 'hbs');

    app.use(express.static(config.get('theme.assets')));

    app.use(function (req, res, next) {
        req.segments = _.compact(req.originalUrl.split('/'));
        tplData.req = req;
        fractal.getStructure().then(function(structure){
            tplData.structure = structure;
            next();
        });
    });

    app.get('/components', function (req, res) {
        res.render('components', merge(tplData, {
            sectionName: 'UI Components'
        }));
    });

    app.get('/components/*', function (req, res) {    
        res.render('components/component', merge(tplData, {
            sectionName: 'UI Components'
        }));
    });

    app.get('/assets', function (req, res) {
        res.render('assets', merge(tplData, {
            sectionName: 'Assets'
        }));
    });

    app.get('/assets/*', function (req, res) {
        res.render('assets/asset', merge(tplData, {
            sectionName: 'Assets'
        }));
    });

    // Page request
    app.get('(/*)?', function (req, res) {
        if (tplData.structure.pages.files.length) {
            var page = _.find(tplData.structure.pages.files, function(p){
                return p.urlPath == req.originalUrl;
            });
            if (page) {
                return res.render(req.originalUrl === '/' ? 'index' : 'pages/page', merge(tplData, {
                    page: page,
                    sectionName: req.segments[0],
                    sectionPages: _.filter(tplData.structure.pages.files, function(file){
                        return file.parentUrlDirs[0] == req.segments[0];
                    })
                }));
            }
        }
        res.render('404', merge(tplData, {
        }));      
    });

    app.listen(port, function () {
        console.log('Fractal server is running at http://localhost:%s', port);
    });

    return app;
};

function navHelper(context, options){
    // return 'foo';
}

/******

test.md
another.html
/foo/bar/baz.md
/foo/bar/index.md
/foo/test/index.md
/foo/test/bar.md
/foo/index.md

******/

function getSectionPages(files){
    var tree = [];
    files.forEach(function(file){

    });
}

// Handlebars.registerHelper('list', function(context, options) {
//   var out = "<ul>", data;

//   if (options.data) {
//     data = Handlebars.createFrame(options.data);
//   }

//   for (var i=0; i<context.length; i++) {
//     if (data) {
//       data.index = i;
//     }

//     out += "<li>" + options.fn(context[i], { data: data }) + "</li>";
//   }

//   out += "</ul>";
//   return out;
// });