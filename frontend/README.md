# Certificate:

Creating a localhost certificate:

```
openssl genrsa -out privkey.pem 2048
openssl req -new -key privkey.pem -out certreq.csr
openssl x509 -req -days 3650 -in certreq.csr -signkey privkey.pem -out fullchain.pem
```
