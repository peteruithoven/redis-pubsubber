redis-pubsubber
===============

Redis pub/sub channel wrapper.
- Messages are serialized to JSON.
- Allows multiple argumens
- Includes a callback system. 
- Multiple channels per pub/sub client.

Example
---------------
``` javascript
// create pub/sub instance (creates redis pub and sub clients
var redisPubSub = require('redis-pubsubber')('mycloud',6379,'localhost');
// create a channel 
var redisChannel = redisPubSub.createChannel("mychannel");
// listen for messages on channel
redisChannel.on("message", function (firstParam,data,callback) {
  // perform some action, respond by calling callback
});
// publish message to channel 
redisChannel.publish("firstdata",{"some":"data"},function(responseData) {
  // do something with the response
});
```
