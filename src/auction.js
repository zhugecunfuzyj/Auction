"use strict";

/*
TODO :
 Create a last-dump table to get track of the current auctions
*/

var database = require('./lib/database'),
  servers = [],
  wowApi = require('./lib/wow-api'),
  logger = require('./logger'),
  maxTry = 10,
  wowDB = require('./lib/wow-db');


wowDB.init(database, wowApi);
database.init(ready);

function queryServers() {
    servers = database.getServers();

    setInterval(function callServers() {
      servers.forEach(function(server){
        query(server.slug,0,function(err, results) {
          database.count(server.slug,function(err,count) {
            logger.log(1,server.name+' has : ' + count);
            database.getSalesOccurence(server.name, function(err, results) {
              console.log('The most present item for ' + server.name + ' is : ');
              console.log(results[0]);
            });
          });
        });
      });
      return callServers;
    }(),1000*60*30);
}


function ready(err){
  if(err) {
    console.log(err);
    return;
  }

  wowDB.getItem(18803,function(err, item){
    console.log(item.name);
  });

}

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
