

const Plugin = require('./lib/plugin');
const PushClient = require('./lib/push-client');

const channel = require('./lib/channel');

const plugin = new Plugin();
const pushclient = new PushClient();

const buffer = {};


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

function notification(channelid) {
  channel(plugin, channelid);
}

function start(options) {
  plugin.debug('version: 0.0.5');
  plugin.debug('start');

  pushclient.on('debug', debug);
  pushclient.on('notification', notification);
  pushclient.setToken(options.token);
  pushclient.connect();
}
