var express = require('express');
var app = express();
var low = require('lowdb');
var storage = require('lowdb/file-sync');

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

var router = express.Router();
var db = low('db.json', {storage: storage});

router.use(function(req, res, next){
  console.log('> Request done: ');
  console.log('  ' + req.method + ' ' + req.url + ' ' + req.headers.accept);
  next();
});

router.get('/', function(req, res){
  var data = {
    items: [],
    pagination: {}
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


