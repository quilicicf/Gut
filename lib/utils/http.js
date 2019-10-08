const _ = require('lodash');
const url = require('url');
const https = require('https');

const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
};

const send = (targetUrl, options) => new Promise((resolve, reject) => {
  const callOptions = {
    ...url.parse(targetUrl),
    ...options,
  };

  _.set(callOptions, 'headers.User-Agent', 'Gut <https://github.com/quilicicf/Gut>');

  const request = https.request(callOptions, (response) => {
    const responseChunks = [];

    response
      .on('data', (chunk) => {
        responseChunks.push(chunk);
      })
      .on('end', () => {
        const responseAsString = _.join(responseChunks, '');
        if (response.statusCode > 299) {
          try {
            return resolve({
              statusCode: response.statusCode,
              body: JSON.parse(responseAsString),
            });

          } catch (parsingError) {
            return resolve({
              statusCode: response.statusCode,
              body: responseAsString,
            });
          }

        }
        try {
          const responseBody = JSON.parse(responseAsString);
          return resolve({
            statusCode: response.statusCode,
            body: responseBody,
          });

        } catch (parsingError) {
          return reject(parsingError);
        }
      })
      .on('error', reject);
  });

  request.on('error', reject);

  if (options.body) {
    request.write(options.json
      ? JSON.stringify(options.body)
      : options.body);
  }

  request.end();
});

module.exports = { HTTP_METHODS, send };
