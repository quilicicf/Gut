const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const https = require('https');

const httpModule = require('../lib/utils/http');

const SUCCESS_PORT = 5200;
const ERROR_PORT = 5500;

const privateKey = fs.readFileSync(path.resolve(__dirname, 'certs', 'privkey.pem'));
const publicKey = fs.readFileSync(path.resolve(__dirname, 'certs', 'cert.pem'));

const createServer = (port, requestHandler) => {
  const certificateOptions = {
    key: privateKey,
    cert: publicKey
  };
  const server = https.createServer(certificateOptions, requestHandler);

  server.listen(port, (error) => {
    if (error) {
      throw error;
    }
  });
};

describe('HTTP client', () => {
  beforeAll(() => {
    createServer(SUCCESS_PORT, (request, response) => {
      request.setEncoding('utf8');

      const requestChunks = [];
      request
        .on('data', (chunk) => {
          requestChunks.push(chunk);
        })
        .on('end', () => {
          response.writeHead(200, { 'Content-type': 'application/json' });
          response.end(_.join(requestChunks));
        });
    });

    createServer(ERROR_PORT, (request, response) => {
      response.status(400);
      response.send('{"message": "This is an error server"}');
    });
  });

  test('It should read the response', () => {
    const body = { test: 'toto' };

    const options = {
      headers: {},
      method: httpModule.HTTP_METHODS.GET,
      requestCert: true,
      ca: publicKey,
      json: true,
      body
    };

    return httpModule.send(`https://localhost:${SUCCESS_PORT}`, options)
      .then((response) => {
        expect(response.statusCode).toBe(200);
        expect(response.body).toBe(body);
      });
  });
});
