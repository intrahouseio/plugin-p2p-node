const EventEmitter = require('events');
const udp = require('dgram');

const CLENT_PORT = 49900;

const SERVER_HOST = '192.168.0.110';
const SERVER_PORT = 49800;

const POLL_INTERVAl = 1000 * 10;

const REGISTRATION = 114;


class P2P extends EventEmitter {
  constructor(options) {
    super();

    this.options = { reg: false, polling: false }
    this.client = udp.createSocket('udp4');
    this.client.on('message', this.message.bind(this));
  }

  debug(msg) {
    this.emit('debug', msg)
  }

  setToken(token) {
    this.options.token = token || 'null';
  }

  mesReg(msg) {
    if (this.options.reg === false) {
      this.options.reg = true;
      this.debug('ok');
    }
  }

  message(msg, info) {
    switch (msg[0]) {
      case REGISTRATION:
        this.mesReg(msg);
        break;
      default:
        break;
    }
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
