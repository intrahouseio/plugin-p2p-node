const Peer = require('simple-peer');
const wrtc = require('wrtc');
const WebSocket = require('ws');

const TransportClient = require('./transport-client');

function getBundle(peer) {

}

function channel(plugin, channelid) {
  const transportclient = new TransportClient();
  const peer = new Peer({ wrtc: wrtc });
  const ws = new WebSocket(`ws://127.0.0.1:${8088}/backend`);

  function signal(data) {
    transportclient.transferdata(data);
  }

  function connect() {
    plugin.debug('p2p: ok');
  }

  function parse(peer, data) {
    const msg = (JSON.parse(data));
    switch (msg.type) {
      case 'bundle':
        getBundle(peer, msg);
        break;
      default:
        break;
    }
  }

  function message(msg) {

  }

  function data(msg) {
    switch (msg[0]) {
      case 48:
        parse(peer, msg.slice(1).toString());
        break;
      case 49:
        buffer[msg.slice(1, 5).toString()] = msg.slice(5).toString();
      break;
      case 50:
        const seq2 = msg.slice(1, 5).toString();
        buffer[seq2] = buffer[seq2] + msg.slice(5).toString();
        break;
      case 51:
        const seq3 = msg.slice(1, 5).toString();
        buffer[seq3] = buffer[seq3] + msg.slice(5).toString();
        parse(peer, buffer[seq3]);
        delete buffer[seq3];
        break;
      default:
        break;
    }
  }

  function transferdata({ transferid, data }) {
    peer.signal(data);
  }

  function open({ transferid }) {
    plugin.debug('p2p...');
  }

  function error() {

  }

  ws.on('message', message);

  peer.on('signal', signal);
  peer.on('connect', connect);
  peer.on('data', data);
  peer.on('error', error);

  transportclient.on('debug', plugin.debug);
  transportclient.on('transferdata', transferdata);
  transportclient.on('open', open)
  transportclient.start(channelid);
}


module.exports = channel;
