# Build environment
FROM node:18 as builder

RUN mkdir /usr/src/app

WORKDIR /usr/src/app
ENV PATH /usr/src/app/node_modules/.bin:$PATH

COPY package.json /usr/src/app/package.json

# Nocache yarn install
RUN yarn config set "strict-ssl" false -g
RUN yarn install --network-timeout 1000000

#RUN npm install 

# copy only required files to not trigger rebuilding every time
COPY ./certs /usr/src/app/certs/
COPY ./public /usr/src/app/public/
COPY ./src /usr/src/app/src/
COPY ./*.sh /usr/src/app/
COPY ./*.json /usr/src/app/

#RUN rm -rf /usr/src/app/node_modules/webpack
RUN yarn build

# Production environment
FROM nginx:1.21.5

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
