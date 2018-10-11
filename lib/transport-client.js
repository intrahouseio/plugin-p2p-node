const EventEmitter = require('events');
const WebSocket = require('ws');

const SERVER_HOST = '192.168.0.110';
const SERVER_PORT = 49800;



class TransportClient extends EventEmitter {
  constructor(options) {
    super();
    this.options = { ...options, sessionid: null, channelid: null, transferid: null };
  }

  debug(text) {
    this.emit('debug', text)
  }

  open() {

  }

  message(data) {
    const msg = JSON.parse(data);

    switch (msg.type) {
      case 'info':
        this.options.sessionid = msg.sessionid;
        this.send('connect_b', { channelid: this.options.channelid });
        break;
      case 'channel':
        this.options.transferid = msg.data.transferid;
        this.debug('channel: ' + this.options.transferid);
        this.emit('open', { transferid: this.options.channelid });
        break;
      case 'transferdata':
        this.emit('transferdata', msg);
        break;
      case 'error':
        break;
      default:
        break;
    }
  }

  send(type, data) {
    this.client.send(JSON.stringify({
      type,
      data,
      sessionid: this.options.sessionid,
    }));
  }

  transferdata(data) {
    this.client.send(JSON.stringify({
      type: 'transferdata',
      data,
      sessionid: this.options.sessionid,
      transferid: this.options.transferid,
    }));
  }

  dispose() {
    this.client = null;
    delete this.client;
  }

  start(channelid) {
    this.options.channelid = channelid;

    this.client = new WebSocket(`ws://${SERVER_HOST}:${SERVER_PORT}`);

    this.client.on('open', this.open.bind(this));
    this.client.on('message', this.message.bind(this));
    this.client.on('close', this.dispose.bind(this));
  }

}

module.exports = TransportClient;
