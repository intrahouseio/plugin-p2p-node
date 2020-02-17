process.on('uncaughtException', function(err) {
  process.send(err.stack);
  setTimeout(() => process.exit(1), 300);
})

const EventEmitter = require('events');


class Plugin extends EventEmitter {

  constructor() {
    super();

    process.on('message', this.message.bind(this));
    this.unitid = process.argv[2];
    this.mode = 0;
    this.channels = [];
    this.system = {};
    this.params = {};
    this.start();
  }

  debug(data) {
    process.send({ type: 'debug', txt: data });
  }

  message(msg) {
    if (msg.type === 'get' && msg.hasOwnProperty('system')) {
      this.system = msg.system;
      this.updateMode();
    }
    if (msg.type === 'get' && msg.hasOwnProperty('params')) {
      this.params = msg.params;
      this.updateMode();
    }
    if (msg.type === 'get' && msg.hasOwnProperty('config')) {
      this.channels = msg.config;
      this.updateMode();
    }

    if (msg.type === 'act') {
      this.emit('actions', msg.data);
    }
    if (msg.type === 'command') {
      this.emit('command', msg);
    }
    if (msg.type === 'debug') {
      this.emit('debug', msg.mode);
    }
  }

  updateMode() {
    this.mode++;
    if (this.mode === 3) {
      this.mode = 4;
      this.emit('start');
    }
  }

  info() {
    this.debug('start');
    this.debug('version: 1.1.0');
  }

  send(tablename) {
    process.send({ type: 'get', tablename: `${tablename}/${this.unitid}` });
  }

  start() {
    this.info();
    this.send('system');
    this.send('params');
    this.send('config');
  }

}

module.exports = Plugin;
