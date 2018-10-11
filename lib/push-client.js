const EventEmitter = require('events');
const udp = require('dgram');

const PORT = 49900;

const SERVER_HOST = '192.168.0.110';
const SERVER_PORT = 49800;

const POLL_INTERVAl = 1000 * 10;

const REGISTRATION = '0';
const STATUS = '1';
const NOTIFICATION_A = '2';
const NOTIFICATION_B = '3';


class PushClient extends EventEmitter {
  constructor(options) {
    super();
    this.options = { ...options };
    this.store = { reg: false, cache: {} };
    this.client = udp.createSocket('udp4');
    this.client.on('message', this.message.bind(this));
  }

  debug(text) {
    this.emit('debug', text)
  }

  polling() {
    this.debug('polling start');
    this.polling = setInterval(this.sendStatus.bind(this), POLL_INTERVAl);

    this.debug('registration...');
    this.send(REGISTRATION, this.options.token);
  }

  setToken(token) {
    this.options.token = token;
  }

  reg() {
    if (!this.store.reg) {
      this.store.reg = true;
      this.emit('debug', 'registration: ok');
    }
  }

  notificationA(msg) {
      this.store.cache[msg] = true;
      this.emit('debug', 'notification: ' + msg);
      this.emit('notification', msg);
  }

  notificationB(msg) {
    if (this.store.cache[msg]) {
      delete this.store.cache[msg];
    } else {
      this.emit('debug', 'notification: ' + msg);
      this.emit('notification', msg);
    }
  }

  message(data, info) {
    const msg = data.toString();
    switch (msg[0]) {
      case REGISTRATION:
        this.reg(msg)
        break;
      case NOTIFICATION_A:
        this.notificationA(msg.slice(1));
        break;
      case NOTIFICATION_B:
        this.notificationB(msg.slice(1));
        break;
      default:
        break;
    }
  }

  sendStatus() {
    this.send(STATUS, this.options.token);
  }

  send(type, data) {
    this.client.send(`${type}${data}`, SERVER_PORT, SERVER_HOST);
  }

  connect() {
    this.client.bind(PORT, this.polling.bind(this));
  }

}

module.exports = PushClient;
