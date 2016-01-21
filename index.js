var express = require('express');
var app = express();
var low = require('lowdb');
var storage = require('lowdb/file-sync');
var uuid = require('uuid');

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
  response.render('pages/index');
});

// API
// ========================================================

// Load variables  ========================================

var router = express.Router();
var db = low('db.json', {storage: storage});

// Enable logging  ========================================

router.use(function(req, res, next){
  console.log('> Request done: ');
  console.log('  ' +
      req.method + ' ' +
      req.url + ' ' +
      req.headers.accept);
  next();
});

// Collection: OPTIONS-method  =============================

router.options('/', function(req, res, next){
  res.header('Allow', 'GET,POST,OPTIONS');
  res.sendStatus(200);
});

// Collection: GET-method  =================================

router.get('/', function(req, res){
  items = db('items').value();
  items.forEach(function(item){
    item.links = [
      {
        rel: "self",
        href: "https://bart-langelaan-rest-api.herokuapp.com/api/" + item.id
      },
      {
        rel: "collection",
        href: "https://bart-langelaan-rest-api.herokuapp.com/api/"
      }
    ]
  });
  var data = {
    items: items,
    links: [{
      rel: "self",
      href: "https://bart-langelaan-rest-api.herokuapp.com/api/"
    }],
    pagination: {
      currentPage: 1,
      currentItems: items.length,
      totalPages: 1,
      totalItems: items.length,
      links: [
        {
          rel: "first",
          page: 1,
          href: "https://bart-langelaan-rest-api.herokuapp.com/api/"
        },
        {
          rel: "last",
          page: 1,
          href: "https://bart-langelaan-rest-api.herokuapp.com/api/"
        },
        {
          rel: "previous",
          page: 1,
          href: "https://bart-langelaan-rest-api.herokuapp.com/api/"
        },
        {
          rel: "next",
          page: 1,
          href: "https://bart-langelaan-rest-api.herokuapp.com/api/"
        }
      ]
    }
  };
  if(req.headers.accept == "application/json"){
    res.json(data);
  }
  else{
    res.sendStatus(415);
  }
});

app.use('/api', router);

// =========================================================
// END API



app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});


