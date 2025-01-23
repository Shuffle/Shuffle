# Build environment
FROM node:23 as builder

ENV NODE_OPTIONS="--max-old-space-size=4096"

RUN mkdir /usr/src/app
WORKDIR /usr/src/app
ENV PATH /usr/src/app/node_modules/.bin:$PATH

COPY package.json /usr/src/app/package.json

# Nocache yarn install
RUN npm config set fetch-retries 3   # Number of retry attempts (default is 2)
RUN npm config set fetch-retry-mintimeout 5000  # Minimum wait time before retrying (in ms, default is 10000)
RUN npm config set fetch-retry-maxtimeout 60000 # Maximum wait time before retrying (in ms, default is 60000)
RUN npm config set fetch-timeout 60000 # Overall fetch timeout (in ms, default is 300000)
RUN npm install --timeout=60000 --legacy-peer-deps

# copy only required files to not trigger rebuilding every time
COPY ./certs /usr/src/app/certs/
COPY ./public /usr/src/app/public/
COPY ./src /usr/src/app/src/
COPY ./*.sh /usr/src/app/
COPY ./*.json /usr/src/app/


RUN npm run build --loglevel verbose 2>&1

# Production environment
FROM nginx:1.26.0

RUN mkdir -p /usr/share/nginx/html/build
RUN mkdir -p /usr/share/nginx/html/css
RUN mkdir -p /usr/share/nginx/html/js
RUN mkdir -p /usr/share/nginx/html/img


# Localhost certificate challenge: Y#XwrJ#DoZGz2w6x
# Cert challenge doesn't matter to be here or not, as ALL production setups should be using their own certificates + reverse proxy: https://shuffler.io/docs/configuration#using-the-nginx-reverse-proxy-for-tls/ssl 
COPY --from=builder /usr/src/app/build /usr/share/nginx/html
COPY --from=builder /usr/src/app/certs/fullchain.pem /etc/nginx/fullchain.cert.pem
COPY --from=builder /usr/src/app/certs/privkey.pem /etc/nginx/privkey.pem

# install CONFD
RUN apt-get update && apt-get install -y curl && apt-get clean
COPY ./confd/templates/nginx.conf /etc/nginx/nginx.conf.tmpl

## OLD CONFD THINGS (not compatible with arm) 
#ENV CONFD_VERSION 0.16.0
#RUN curl -sSL https://github.com/kelseyhightower/confd/releases/download/v${CONFD_VERSION}/confd-${CONFD_VERSION}-linux-amd64 -o /usr/local/bin/confd && \
#    chmod +x /usr/local/bin/confd
#COPY ./confd /etc/confd
# rewrite command & entrypoint with ours

COPY ./entrypoint.sh /
ENV BACKEND_HOSTNAME="shuffle-backend"
ENTRYPOINT [ "/entrypoint.sh" ]
CMD ["nginx", "-g", "daemon off;"]

EXPOSE 80
EXPOSE 443
