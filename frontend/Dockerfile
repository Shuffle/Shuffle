# Build environment
FROM node as builder

RUN mkdir /usr/src/app
WORKDIR /usr/src/app
ENV PATH /usr/src/app/node_modules/.bin:$PATH
COPY package.json /usr/src/app/package.json

RUN npm install --verbose

COPY . /usr/src/app

RUN npm run-script build

# Production environment
from nginx:latest

RUN mkdir -p /usr/share/nginx/html/build
RUN mkdir -p /usr/share/nginx/html/css
RUN mkdir -p /usr/share/nginx/html/js
RUN mkdir -p /usr/share/nginx/html/img

COPY --from=builder /usr/src/app/build /usr/share/nginx/html

#Localhost certificate challenge: Y#XwrJ#DoZGz2w6x
COPY --from=builder /usr/src/app/certs/fullchain.pem /etc/nginx/fullchain.cert.pem
COPY --from=builder /usr/src/app/certs/privkey.pem /etc/nginx/privkey.pem

# Prod
COPY --from=builder /usr/src/app/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
EXPOSE 443
