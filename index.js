const Plugin = require('./lib/plugin');

const plugin = new Plugin();


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
  require('./test.js')
}
