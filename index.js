var express = require('express');
var app = express();
var low = require('lowdb');
var storage = require('lowdb/file-sync');
var uuid = require('uuid');
var bodyParser = require('body-parser');
var EasyXml = require('easyxml');
var serializer = new EasyXml({
  singularizeChildren: true,
  allowAttributes: true,
  rootElement: 'pils',
  dateFormat: 'ISO',
  indent: 2,
  manifest: true
});

var API_DOMAIN = "https://bart-langelaan-rest-api.herokuapp.com/api/";
//API_DOMAIN = "https://nkfiychwby.localtunnel.me/api/";

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

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
  if(Object.keys(req.body).length)
    console.log('  ',req.body);
  console.log('');
  next();
});

// Collection: OPTIONS-method  =============================

router.options('/', function(req, res, next){
  res.header('Allow', 'GET,POST,OPTIONS');
  res.sendStatus(200);
});

// Collection: GET-method  =================================

router.get('/', function(req, res){
  var items;
  var start = req.query.start ? parseInt(req.query.start) : undefined;
  var limit = req.query.limit ? parseInt(req.query.limit) : undefined;
  if(limit)
    items = db('items')
        .chain()
        .take(limit)
        .value();
  else
    items = db('items').value();
  items.forEach(function(item){
    item.links = [
      {
        rel: "self",
        href: API_DOMAIN + item.id
      },
      {
        rel: "collection",
        href: API_DOMAIN
      }
    ]
  });
  var data = {
    items: items,
    links: [{
      rel: "self",
      href: API_DOMAIN
    }],
    pagination: {
      currentPage: start || 1,
      currentItems: limit || items.length,
      totalPages: start ? start + 1: 1,
      totalItems: db('items').size(),
      links: [
        {
          rel: "first",
          page: 1,
          href: API_DOMAIN + (limit ? "?start="+1+"&limit="+limit : "")
        },
        {
          rel: "last",
          page: start ? start + 1: 1,
          href: API_DOMAIN + (limit ? "?start="+ db('items').size() +"&limit="+limit : "")
        },
        {
          rel: "previous",
          page: start ? start - 1 : 1,
          href: API_DOMAIN + (limit ? "?start="+ (start - 1) +"&limit="+limit : "")
        },
        {
          rel: "next",
          page: start ? start + 1: 1,
          href: API_DOMAIN + (limit ? "?start="+ (start + 1) +"&limit="+limit : "")
        }
      ]
    }
  };
  if(req.headers.accept == "application/json"){
    res.json(data);
  }
  else if(req.headers.accept == "application/xml"){
    res.header("Content-Type", "application/xml");
    res.send(serializer.render(data));
  }
  else{
    res.sendStatus(415);
  }
});

// Collection: POST-method  ================================

router.post('/', function(req, res){
  if(req.body.title && req.body.body && req.body.user){
    db("items").push({
      id: uuid(),
      title: req.body.title,
      body: req.body.body,
      user: req.body.user
    });
    res.sendStatus(201);
  }
  else{
    res.sendStatus(400);
  }
});

// Detail: OPTIONS-method  =================================

router.options('/:id', function(req, res){
  res.header('Allow', 'GET,PUT,DELETE,OPTIONS');
  res.sendStatus(200);
});

// Detail: GET-method  =====================================

router.get('/:id', function(req, res){
  var data = db("items").find({
    id: req.params.id
  });
  if(!data){
    res.sendStatus(404);
  }
  else if(req.headers.accept == "application/json"){
    res.json(data);
  }
  else if(req.headers.accept == "application/xml"){
    res.header("Content-Type", "application/xml");
    res.send(serializer.render(data));
  }
  else{
    res.sendStatus(415);
  }
});

// Detail: DELETE-method  ==================================

router.delete('/:id', function(req, res){
  db('items').remove({
    id: req.params.id
  });
  res.sendStatus(204);
});

app.use('/api', router);

// =========================================================
// END API



app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});


