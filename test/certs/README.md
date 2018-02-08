## Certificates

The certificates in this folder are used to test the HTTP module.
They should only be used for that as they are **public** on GitHub.

If they need to be renewed, run:

```shell
cd "$GUT/test/certs"
openssl req -x509 -days 3650 -newkey rsa:2048 -nodes -sha256 -subj '/CN=localhost' \
  -keyout privkey.pem -out cert.pem
```
