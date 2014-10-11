var redis = require('redis');
var util = require("util");
var EventEmitter = require("events").EventEmitter;
var debug = require('debug')('redis-pubsubber');
var EVENT_MSG = "event";
var ACK_MSG = "ack";
var callbackIDCounter = 0;
var callbacks = {};
module.exports = RedisPubSub;

function RedisPubSub(prefix,port,host) {
  if (!(this instanceof RedisPubSub)) return new RedisPubSub(prefix,port,host);

  var _self = this;
  var pub = redis.createClient(port,host);
  var sub = redis.createClient(port,host);
  sub.setMaxListeners(0);
  pub.on('error',onRedisError);
  sub.on('error',onRedisError);
  function onRedisError(err){
    _self.emit("error",err);
  }
  this.createChannel = function(name) {
    var channel = new Channel(prefix+name,pub,sub);
    channel.on('error',onRedisError);
    return channel;
  };
}
util.inherits(RedisPubSub, EventEmitter);

function Channel(name,pub,sub) {
  var _self = this;
  sub.subscribe(name,function(err){
    debug("subsribed to channel: ",name);
    if(err !== null) _self.emit("error",err);
  });

  sub.on("message", function (channel, packet) {
    if(channel !== name) return;
    packet = JSON.parse(packet);
    debug("received packet: ",packet);
    var data = packet.data;
    var callbackID = packet.id;
    switch(packet.type){
      case EVENT_MSG:
        data.unshift("message"); // add event type in front
        data.push(eventCallback); // add callback to end
        _self.emit.apply(_self,data);

        function eventCallback() {
          if(callbackID === undefined) {
            return _self.emit("error","No callback defined");
          }
          var args = Array.prototype.slice.call(arguments);
          var ackPacket = {type:ACK_MSG,
                          data:args,
                          id: callbackID};
          debug("publishing ack packet: ",ackPacket);
          pub.publish(name,JSON.stringify(ackPacket),function(err){
            if(err !== null) _self.emit("error",err);
          });
        }

        break;
      case ACK_MSG:
        if(typeof callbacks[callbackID] == 'function'){
          callbacks[callbackID].apply(this, packet.data);
          delete callbacks[callbackID];
        }
        break;
    }
  });

  this.publish = function() {
    var args = Array.prototype.slice.call(arguments);
    var packet = {type:EVENT_MSG,
                  data:args};
    // is there a callback function?
    if(typeof args[args.length - 1] == 'function') {
      packet.id = callbackIDCounter++;
      callbacks[packet.id] = packet.data.pop();
    }
    debug("publishing packet: ",packet);
    pub.publish(name,JSON.stringify(packet),function(err){
      if(err !== null) _self.emit("error",err);
    });
  };
}
util.inherits(Channel, EventEmitter);
