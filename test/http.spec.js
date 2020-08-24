const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const https = require('https');

const httpModule = require('../lib/utils/http');

const SUCCESS_PORT = 5200;
const ERROR_PORT = 5500;

const privateKey = fs.readFileSync(path.resolve(__dirname, 'certs', 'privkey.pem'));
const publicKey = fs.readFileSync(path.resolve(__dirname, 'certs', 'cert.pem'));

const servers = {};

const createServer = (port, requestHandler) => {
  const certificateOptions = {
    key: privateKey,
    cert: publicKey,
  };

  const server = https
    .createServer(certificateOptions)
    .listen(port);
  server.on('request', requestHandler);
  server.sockets = [];

  server.on('connection', (socket) => {
    server.sockets.push(socket);
  });

  return server;
};

beforeAll(() => {
  servers.success = createServer(SUCCESS_PORT, (request, response) => {
    const requestChunks = [];
    request
      .on('data', (chunk) => {
        requestChunks.push(chunk);
      })
      .on('end', () => {
        response.writeHead(200, { 'Content-type': 'application/json' });

        if (!_.isEmpty(requestChunks)) {
          response.end(_.join(requestChunks, ''));
        } else {
          response.end();
        }
      });
  });

  servers.error = createServer(ERROR_PORT, (request, response) => {
    response.status(400);
    response.send('{"message": "This is an error server"}');
  });
});

describe('HTTP client', () => {
  test('It should read the response', async () => {
    const body = { test: 'toto' };

    const options = {
      headers: {},
      method: httpModule.HTTP_METHODS.POST,
      requestCert: true,
      ca: publicKey,
      json: true,
      body,
    };

    const response = await httpModule.send(`https://localhost:${SUCCESS_PORT}`, options);
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(body);
  });
});

afterAll(() => {
  _.each(servers, (server) => {
    server.close();
    _.each(server.sockets, (socket) => {
      socket.destroy();
    });
  });
});
