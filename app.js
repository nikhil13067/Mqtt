var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var index = require('./routes/index');
var users = require('./routes/users');

var app = express();
////////////////////////

var EventHubClient = require('azure-event-hubs').Client;
var connectionString = 'HostName=mqtt13067.azure-devices.net;SharedAccessKeyName=iothubowner;SharedAccessKey=1zL4VZDJUtNaxBa6z7bfOpJ1JGvp1bcNfeWc0h/7lcY=';
var temperature=45;
var printError = function (err) {
  console.log(err.message);
};
var printMessage = function (message) {
  // console.log('Message received: ');
  console.log(JSON.stringify(message.body));
  temperature = message.body.temperature;
  //console.log(temperature);

};
var client = EventHubClient.fromConnectionString(connectionString);
var http = require("http");
client.open()
    .then(client.getPartitionIds.bind(client))
    .then(function (partitionIds) {
      return partitionIds.map(function (partitionId) {
        return client.createReceiver('$Default', partitionId, { 'startAfterTime' : Date.now()}).then(function(receiver) {
          console.log('Created partition receiver: ' + partitionId)
          receiver.on('errorReceived', printError);
          receiver.on('message', printMessage);

        });
      });
    })
    .catch(printError);
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
var router = express.Router();

app.use('/', index);
app.use('/users', users);

app.get('/data', function(req, res){
  res.json({ "temperature": temperature, "timeStamp":Date.now() });
});


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
