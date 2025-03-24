FROM golang:1.23 as builder

# Add files
RUN mkdir /app
RUN mkdir /app_sdk
WORKDIR /app
ADD ./go-app/main.go /app
ADD ./go-app/walkoff.go /app
ADD ./go-app/docker.go /app

ADD ./go-app/go.mod /app

# Required files for code generation
RUN wget -O /app_sdk/app_base.py https://raw.githubusercontent.com/Shuffle/app_sdk/refs/heads/main/shuffle_sdk/shuffle_sdk.py
ADD ./app_gen /app_gen

RUN go mod download
RUN go mod tidy

# From November 2022, CGO is enabled due to packages
# that we use requiring it. This is a temporary fix
# and makes us HAVE to install libc compatibility packages farther down.
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o webapp .

# Certificate build - gets required certs
FROM alpine:latest as certs
RUN apk add --update ca-certificates

# Sets up the final image
FROM alpine:3.21.2

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
