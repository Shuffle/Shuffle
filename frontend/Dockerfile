# Build environment
FROM node as builder

RUN mkdir /usr/src/app

WORKDIR /usr/src/app
ENV PATH /usr/src/app/node_modules/.bin:$PATH

COPY package.json /usr/src/app/package.json

RUN npm install --verbose --legacy-peer-deps

# copy only required files to not trigger rebuilding every time
COPY ./certs /usr/src/app/certs/
COPY ./public /usr/src/app/public/
COPY ./src /usr/src/app/src/
COPY ./*.sh /usr/src/app/
COPY ./*.json /usr/src/app/

# There were issues with the webpack installer from package.json
RUN rm -rf /usr/src/app/node_modules/webpack
RUN npm install webpack@4.42.0

RUN npm run-script build

# Production environment
FROM nginx:latest

RUN mkdir -p /usr/share/nginx/html/build
RUN mkdir -p /usr/share/nginx/html/css
RUN mkdir -p /usr/share/nginx/html/js
RUN mkdir -p /usr/share/nginx/html/img

COPY --from=builder /usr/src/app/build /usr/share/nginx/html

#Localhost certificate challenge: Y#XwrJ#DoZGz2w6x
COPY --from=builder /usr/src/app/certs/fullchain.pem /etc/nginx/fullchain.cert.pem
COPY --from=builder /usr/src/app/certs/privkey.pem /etc/nginx/privkey.pem

# install CONFD
ENV CONFD_VERSION 0.16.0
RUN apt-get update && apt-get install -y curl && apt-get clean
RUN curl -sSL https://github.com/kelseyhightower/confd/releases/download/v${CONFD_VERSION}/confd-${CONFD_VERSION}-linux-amd64 -o /usr/local/bin/confd && \
    chmod +x /usr/local/bin/confd
COPY ./confd /etc/confd

# rewrite command & entrypoint with ours
COPY ./entrypoint.sh /
ENTRYPOINT [ "/entrypoint.sh" ]
CMD ["nginx", "-g", "daemon off;"]

EXPOSE 80
EXPOSE 443
