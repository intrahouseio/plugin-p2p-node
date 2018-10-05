const Plugin = require('./lib/plugin');

const plugin = new Plugin();

var Peer = require('simple-peer')
var wrtc = require('wrtc')

var peer1 = new Peer({ initiator: true, wrtc: wrtc })
var peer2 = new Peer({ wrtc: wrtc })


plugin.on('params', params => {
  start(params);
});

plugin.on('channels', channels => {
  // console.log(channels);
});

plugin.on('debug', mode => {});


function start(options) {
  plugin.debug("version: 0.0.5");
  plugin.debug("start");
  test()
}

function test() {

  peer1.on('signal', function (data) {
    peer2.signal(data)
  })

  peer2.on('signal', function (data) {
    peer1.signal(data)
  })

  peer1.on('connect', function () {
    plugin.debug('send message');
    peer1.send('data reciverd!')
  })

  peer2.on('data', function (data) {
    plugin.debug(data.toString());
  })

}
