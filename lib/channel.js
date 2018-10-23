const Peer = require('simple-peer');
const wrtc = require('wrtc');
const WebSocket = require('ws');
const request = require('request');

const TransportClient = require('./transport-client');

const MAXIMUM_MESSAGE_SIZE = 10000;
const buffer = {};
let seq = 1000;

function send(peer, data, progress = false) {
  if (seq > 9999) {
    seq = 1000;
  } else {
    seq++;
  }

  const temp = JSON.stringify(data)
  const l = temp.length;

  if (progress) {
    peer.send('0' + JSON.stringify({ type: 'progress_start', length: l }));
  }

  if (l > MAXIMUM_MESSAGE_SIZE) {
    for (var i = 0; i < l; i = i + MAXIMUM_MESSAGE_SIZE) {
      if (i === 0) {
        peer.send('1' + seq.toString() + temp.slice(i, i + MAXIMUM_MESSAGE_SIZE))
      } else {
        if (i + MAXIMUM_MESSAGE_SIZE <= l) {
          peer.send('2' + seq.toString() + temp.slice(i, i + MAXIMUM_MESSAGE_SIZE))
        } else {
          peer.send('3' + seq.toString() + temp.slice(i, i + MAXIMUM_MESSAGE_SIZE))
        }
      }
    }
  } else {
    peer.send('0' + temp);
  }

  if (progress) {
    peer.send('0' + JSON.stringify({ type: 'progress_stop' }));
  }
}

function getBundle(peer, bundels, msg) {
  send(peer, bundels.getBundle(msg.mode, msg.cacheid), true);
}

function image(peer, name, url, port) {
  request({ uri: `http://127.0.0.1:${port}/uploadfiles/images/${url}`, encoding: 'binary' }, (error, response, body) => {
    if (!error && response.statusCode == 200) {
      send(peer, { type: 'image', name, data: new Buffer(body, 'binary').toString('base64'), url });
    } else {
      send(peer, { type: 'image', name, data: '', url });
    }
  });
}

function http(peer, url, id, binary, port) {
  if (binary) {
    request({ uri: `http://127.0.0.1:${port}${url}`, encoding: 'binary' }, (error, response, body) => {
      const filename = response.headers['content-disposition']
        .toLowerCase()
        .split('filename=')[1]
        .split(';')[0]
        .replace(/"/g, '');
      if (!error && response.statusCode == 200) {
        send(peer, { type: 'http', id, binary, filename, data: new Buffer(body, 'binary').toString('base64') });
      } else {
        send(peer, { type: 'http', id, binary, filename, data: false });
      }
    });
  } else {
    request({ uri: `http://127.0.0.1:${port}${url}` }, (error, response, body) => {
      if (!error && response.statusCode == 200) {
        send(peer, { type: 'http', id, binary, data: body });
      } else {
        send(peer, { type: 'http', id, binary, data: false });
      }
    });
  }
}

function upload(peer, filename, params, data, id, port) {
  const options = {
    method: "POST",
    url: `http://127.0.0.1:${port}/uploadfiles`,
    headers: { 'Content-Type': 'multipart/form-data' },
    formData : {
        params: JSON.stringify(params),
        file : {
          value:  new Buffer(data, 'base64'),
          options: {
            filename,
          },
        }
    },
};
request(options, function (err, res, body) {
    if (err) {
      send(peer, { type: 'upload', id, name: false });
    } else {
      send(peer, { type: 'upload', id, name: body });
    }
  });
}

function channel(plugin, bundles, channelid) {
  const transportclient = new TransportClient();
  const peer = new Peer({ wrtc: wrtc });
  const ws = new WebSocket(`ws://127.0.0.1:${plugin.system.port}/backend`);

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
        getBundle(peer, bundles, msg);
        break;
      case 'ws':
        ws.readyState === ws.OPEN && ws.send(msg.data);
        break;
      case 'image':
        image(peer, msg.name, msg.url, plugin.system.port);
        break;
      case 'http':
        http(peer, msg.url, msg.id, msg.binary, plugin.system.port);
        break;
      case 'upload':
        upload(peer, msg.filename, msg.params, msg.data, msg.id, plugin.system.port);
        break;
      default:
        break;
    }
  }

  function message(msg) {
    send(peer, { type: 'ws', data: msg });
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

  function close() {
    try {
      if (peer) {
        peer.destroy();
        delete peer;
      }
      if (ws) {
        ws.close();
        delete ws;
      }
      if (transportclient) {
        delete transportclient;
      }
    } catch (e) {

    }
  }

  ws.on('message', message);

  peer.on('signal', signal);
  peer.on('connect', connect);
  peer.on('data', data);
  peer.on('error', error);
  peer.on('close', close);

  transportclient.on('debug', plugin.debug);
  transportclient.on('transferdata', transferdata);
  transportclient.on('open', open)
  transportclient.start(channelid);
}


module.exports = channel;
