"use strict";

var Queue = require('./lib/queue'),
    queue = new Queue();

queue.listen('test', function(message) {
  console.log(message);
});

queue.publish('test',44);