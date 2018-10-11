const Peer = require('simple-peer');

const Plugin = require('./lib/plugin');
const PushClient = require('./lib/push-client');
const TransportClient = require('./lib/transport-client');

const plugin = new Plugin();
const pushclient = new PushClient();


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
  const transportclient = new TransportClient();
  const peer = new Peer();

  function signal(data) {
    console.log(data)
    // transportclient.transferdata(data);
  }

  function connect() {

  }

  function data() {

  }

  function transferdata({ transferid, data }) {
    peer.signal(data);
  }

  function open({ transferid }) {
    // console.log(transferid);
  }

  peer.on('signal', signal);
  peer.on('connect', connect);
  peer.on('data', data);

  transportclient.on('debug', debug);
  transportclient.on('transferdata', transferdata);
  transportclient.on('open', open)
  transportclient.start(channelid);
}

function start(options) {
  plugin.debug("version: 0.0.5");
  plugin.debug("start");

  pushclient.on('debug', debug);
  pushclient.on('notification', notification);
  pushclient.setToken(options.token);
  pushclient.connect();
}
