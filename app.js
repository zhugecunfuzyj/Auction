var DATA = require('./lib/database'),
  database = new DATA(),
  API = require('./lib/wow-api'),
  wowApi = new API(),
  logger = require('./logger'),
  maxTry = 10;

function query(server, count, callback) {
  wowApi.query(server,function(err,body) {
    if(!err && body && body.results && body.results.realm) {
      logger.log(0,body.results.realm);
      logger.log(0,body.results.auctions.auctions.length);
      database.insertDump(body.results.auctions.auctions, body.timestamp, function(err, results) {
        //Doesn't test for errors, because it will always have some due to duplicates
        logger.log(1, 'Dump was inserted');
        callback(err, results);
      });
    }
    else {
      console.log('An error occured ' + err);
      if(count < maxTry)
        query(server, count + 1, callback);
      else
        logger.log(0, 'Gave up trying to get data for : ' + server);
    }
  });
}
