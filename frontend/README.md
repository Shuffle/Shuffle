## Lalits frontend magic

## Localhost Certificate info:


Creating a localhost certificate:

```
openssl genrsa -out privkey.pem 2048
openssl req -new -key privkey.pem -out certreq.csr
openssl x509 -req -days 3650 -in certreq.csr -signkey privkey.pem -out fullchain.pem
```

## Using your own certificate
If you have your own .crt and .key file, you can do it like this:
```
openssl x509 -in mycert.crt -out fullchain.cert.pem -outform PEM
```

The KEY file has to be named privkey.pem 
```
mv cert.key privkey.pem
```
