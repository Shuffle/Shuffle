FROM golang:1.17.2-buster as builder

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

RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o webapp .

# Certificate build - gets required certs
FROM alpine:latest as certs
RUN apk --update add ca-certificates

FROM alpine:3.14

COPY --from=builder /app/ /app
COPY --from=builder /app_sdk/ /app_sdk
COPY --from=builder /app_gen/ /app_gen
COPY --from=certs /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt

WORKDIR /app
EXPOSE 5001
CMD ["./webapp"]
