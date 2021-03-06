"use strict";

var redis = require("redis"),
  prefix = 'channel_',
  logger = require('../sLogger'),
  listenTokens = [],
  _ = require('lodash'),
  Promise = require('bluebird'),
  RedisError = require('./errors').RedisError;


var queue = function() {
  this.callbacks_popsub = [];
  this.sub = redis.createClient();
  this.pub = redis.createClient();
  this.sub.on("error", function(err) {
    console.error("Sub Error " + err);
  });
  this.pub.on("error", function(err) {
    console.error("Pub Error " + err);
  });
  var self = this;
  this.sub.on('message', function(channel, message) {
    self.callbacks_popsub.forEach(function(cb) {
      if (cb.channel === channel)
        cb.callback(message);
    });
  });
};

queue.prototype.subscribe = function(channel, callback) {
  this.sub.subscribe(channel);
  this.callbacks_popsub.push({
    channel: channel,
    callback: callback
  });
};
queue.prototype.unsubscribe = function(channel) {
  this.sub.unsubscribe(channel);
  var i = _.findIndex(this.callbacks_popsub, function(res) {
    return res.channel === channel;
  });
  if (i >= 0)
    this.callbacks_popsub.splice(i, 1);
};

queue.prototype.publish = function(channel, message) {
  this.pub.publish(channel, message);
};

queue.prototype.send = function(channel, message) {
  logger.log('queue', 'Send on ' + channel);
  this.pub.rpush(prefix + channel, JSON.stringify(message));
};

queue.prototype.oneListen = function(channel, cb) {
  let client = redis.createClient();

  client.blpop(prefix + channel, 0, (err, message) => {
    if (err)
      logger.log(['queue', 'error'], err);

    logger.log('queue', 'Received a message on ' + channel);
    process.nextTick(() => {
      client.quit();
      if (!err)
        cb(null, JSON.parse(message[1]));
      else {
        cb(err);
      }
    });
  });
};

module.exports = queue;
