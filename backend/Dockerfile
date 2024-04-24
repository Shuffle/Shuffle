FROM golang:1.22 as builder

# Add files
RUN mkdir /app
RUN mkdir /app_sdk
WORKDIR /app
ADD ./go-app/main.go /app
ADD ./go-app/walkoff.go /app
ADD ./go-app/docker.go /app

ADD ./go-app/go.mod /app

# Required files for code generation
ADD ./app_sdk/app_base.py /app_sdk
ADD ./app_gen /app_gen

RUN go get -v
RUN go mod tidy
RUN go clean -modcache

# From November 2022, CGO is enabled due to packages
# that we use requiring it. This is a temporary fix
# and makes us HAVE to install libc compatibility packages farther down.
RUN CGO_ENABLED=1 GOOS=linux go build -a -installsuffix cgo -o webapp .

# Certificate build - gets required certs
FROM alpine:latest as certs
RUN apk --update add ca-certificates

# Sets up the final image
FROM alpine:3.17.0

# FIXME: Install cgo because CGO_ENABLED=1 during build
RUN apk add --no-cache libc6-compat
RUN apk add --no-cache libstdc++

COPY --from=builder /app/ /app
COPY --from=builder /app_sdk/ /app_sdk
COPY --from=builder /app_gen/ /app_gen
COPY --from=certs /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt

WORKDIR /app
EXPOSE 5001
CMD ["./webapp"]
