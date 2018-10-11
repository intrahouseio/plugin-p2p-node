const EventEmitter = require('events');
const udp = require('dgram');
const WebSocket = require('ws');

const CLENT_PORT = 49900;

const SERVER_HOST = '192.168.0.110';
const SERVER_PORT = 49800;

const POLL_INTERVAl = 1000 * 10;

const REGISTRATION = 114;
const SESSION = 35;


class P2P extends EventEmitter {
  constructor(options) {
    super();

    this.options = { reg: false, polling: false, session: false }
    this.store = { };

    this.client = udp.createSocket('udp4');
    this.client.on('message', this.message.bind(this));
  }

  debug(msg) {
    this.emit('debug', msg)
  }

  setToken(token) {
    this.store.token = token || 'null';
    this.options.token = token || 'null';
  }

  mesReg(msg) {
    if (this.options.reg === false) {
      this.options.reg = true;
      this.debug('ok');
    }
  }

  mesSession(msg) {
    if (this.options.session === false) {
      this.options.session = true;

      this.store.socket = new WebSocket(`ws://${SERVER_HOST}:${SERVER_PORT}`);
      this.store.socket.on('message', this.messagews.bind(this));

      this.debug(`session ${msg.slice(2)}`);
      this.send(`# ${msg.slice(2)}`);
    }
  }

  mesStart(msg) {
    this.store.session = msg.session;
    this.sendws('connect', {});
  }

  message(msg, info) {
    switch (msg[0]) {
      case REGISTRATION:
        this.mesReg(msg);
        break;
      case SESSION:
        this.mesSession(msg);
        break;
      default:
        break;
    }
  }

  messagews(data) {
    const msg = JSON.parse(data);

    switch (msg.type) {
      case 'start':
        this.mesStart(msg);
        break;
      default:
        break
    }
  }

  sendws(type, data) {
    this.store.socket.send(JSON.stringify({
      type,
      data,
      key: this.store.token,
      session: this.store.session,
      client: 'plugin',
    }));
  }

  send(text) {
    this.client.send(text, SERVER_PORT, SERVER_HOST);
  }

  status() {
    this.send(`s ${this.options.token}`);
  }

  reg() {
    this.send(`r ${this.options.token}`);
  }

  polling() {
    this.debug('polling start');
    this.polling = setInterval(this.status.bind(this), POLL_INTERVAl);
  }

  start() {
    this.client.bind(CLENT_PORT, () => {
      this.debug('registration...');
      this.polling();
      this.reg();
    });
  }
}

module.exports = P2P;
