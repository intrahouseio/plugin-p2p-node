const Plugin = require('./lib/plugin');
const P2P = require('./lib/p2p');

const plugin = new Plugin();
const p2p = new P2P();


plugin.on('params', params => {
  start(params);
});

plugin.on('channels', channels => {
  // console.log(channels);
});

plugin.on('debug', mode => {});

function debug(msg) {
  plugin.debug(msg);
}


function start(options) {
  plugin.debug("version: 0.0.5");
  plugin.debug("start");

  p2p.on('debug', debug);
  p2p.setToken(options.token);

  p2p.start();
}
