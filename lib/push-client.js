const EventEmitter = require('events');
const udp = require('dgram');


const SERVER_HOST = 'intrahouse.io';
const SERVER_PORT = 49000;

const POLL_INTERVAl = 1000 * 10;
const FAIL_PONG = 3;

const REGISTRATION = '0';
const STATUS = '1';
const NOTIFICATION_A = '2';
const NOTIFICATION_B = '3';


class PushClient extends EventEmitter {
  constructor(options) {
    super();
    this.options = { ...options };
    this.store = { reg: false, cache: {}, pong: 0 };
    this.client = udp.createSocket('udp4');
    this.client.on('message', this.message.bind(this));
  }

  debug(text) {
    this.emit('debug', text)
  }

  polling() {
    this.debug('polling start');
    this.timer = setInterval(this.sendStatus.bind(this), POLL_INTERVAl);

    this.debug('registration...');

    ++this.store.pong;

    this.send(REGISTRATION, this.options.token);
    this.send(REGISTRATION, this.options.token);
    
  }

  setToken(token) {
    this.options.token = token;
  }

  reg() {
    if (!this.store.reg) {
      this.store.pong = 0;
      this.store.reg = true;
      this.emit('debug', 'registration: ok');
    }
  }

  status() {
    if (!this.store.reg) {
      this.store.reg = true;
      this.emit('debug', 'registration: ok');
    }
    this.store.pong = 0;
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
      case STATUS:
        this.status(msg)
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

  restart() {
    this.emit('debug', '--------restart connection--------');
    
    clearInterval(this.timer);

    this.client.close(() => {
      this.store = { reg: false, cache: {}, pong: 0 };

      this.client = udp.createSocket('udp4');
      this.client.on('message', this.message.bind(this));

      this.client.bind(this.polling.bind(this));
    });
  }

  sendStatus() {
    if (this.store.pong) {
      this.emit('debug', 'connection failed: ' + this.store.pong);
    }
    if (this.store.pong === FAIL_PONG) {
      this.restart();
    } else {
      ++this.store.pong;
      this.send(STATUS, this.options.token);
    }
  }

  send(type, data) {
    this.client.send(`${type}${data}`, SERVER_PORT, SERVER_HOST);
  }

  connect() {
    this.client.bind(this.polling.bind(this));
  }

}

module.exports = PushClient;
