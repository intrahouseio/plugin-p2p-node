

const Plugin = require('./lib/plugin');
const PushClient = require('./lib/push-client');
const Bundles = require('./lib/bundels');

const channel = require('./lib/channel');


const plugin = new Plugin();
const bundles = new Bundles();
const pushclient = new PushClient();


function debug(msg) {
  plugin.debug(msg);
}

function notification(channelid) {
  channel(plugin, bundles, channelid);
}

plugin.on('start', () => {
  bundles.on('load', () => {
    debug('bundels: ok');
    pushclient.on('debug', debug);
    pushclient.on('notification', notification);
    pushclient.setToken(plugin.params.token);
    pushclient.connect();
  })

  debug('bundels...')
  bundles.load(plugin.system.port, plugin.params.token)
});
