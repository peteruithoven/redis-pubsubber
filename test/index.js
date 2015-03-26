require("should");
require("mocha");
require('look').start();
var redisPubSub = require('../')('test',6379,'localhost');

describe('basics', function () {
  describe('publishing and receiving',function() {
    it('should receive published messages',function(done) {
      var redisChannel = redisPubSub.createChannel("publish");
      var messageType = "firstdata";
      redisChannel.on("message", function (type) {
        type.should.equal(messageType);
        done();
      });
      redisChannel.publish(messageType);
    });
    it('should receive published messages with json',function(done) {
      var redisChannel = redisPubSub.createChannel("json");
      var messageData = {foo:'bar',year:2015};
      redisChannel.on("message", function (data) {
        data.should.containDeep(messageData);
        done();
      });
      redisChannel.publish(messageData);
    });
    it('should receive published messages with multiple arguments',function(done) {
      var redisChannel = redisPubSub.createChannel("multiple");
      var messageType = 'foo';
      var messageData = 'bar';
      redisChannel.on("message", function (type,data) {
        type.should.equal(messageType);
        data.should.equal(messageData);
        done();
      });
      redisChannel.publish(messageType,messageData);
    });
    it('should call callback when receiver calls it',function(done) {
      var redisChannel = redisPubSub.createChannel("response");
      var request = 'foo';
      var response = 'bar';
      redisChannel.on("message", function (data, callback) {
        data.should.equal(request);
        callback.should.be.Function;
        callback(response);
      });
      redisChannel.publish(request,function(data) {
        data.should.equal(response);
        done();
      });
    });
  });
});