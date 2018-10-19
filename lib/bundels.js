const EventEmitter = require('events');
const request = require('request');
const crypto = require('crypto');

const store = {};

class Bundels extends EventEmitter {

  constructor() {
    super();
    this.mode = 0;
    this.token = '';
  }

  setBundle(name, data) {
    this.mode++;
    store[name] = {
      cacheid: crypto.createHash('md5').update(data).digest("hex"),
      data,
    }
    if (this.mode === 2) {
      this.emit('load');
    }
  }

  getBundle(name, cacheid) {
    if (store[name].cacheid === cacheid) {
      return { type: 'bundle', data: null, cacheid: store[name].cacheid, mode: name, token: this.token };
    }
    return { type: 'bundle', data: store[name].data, cacheid: store[name].cacheid, mode: name, token: this.token };
  }

  load(port, token) {
    this.token = token;
    request({ uri: `http://127.0.0.1:${port}/pm/js/bundle.js.gz`, gzip: true }, (error, response, data) => {
      this.setBundle('pm', data);
    });
    request({ uri: `http://127.0.0.1:${port}/js/bundle.js.gz`, gzip: true }, (error, response, data) => {
      this.setBundle('ui', data);
    });
  }
}

module.exports = Bundels;
