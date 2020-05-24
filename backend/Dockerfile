from golang as builder

# Add files
RUN mkdir /app
RUN mkdir /app_sdk
WORKDIR /app
ADD ./go-app/main.go /app
ADD ./go-app/walkoff.go /app
ADD ./go-app/docker.go /app
ADD ./go-app/codegen.go /app

ADD ./go-app/go.mod /app

RUN go get -v

RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o webapp .

# Certificate build - gets required certs
FROM alpine:latest as certs
RUN apk --update add ca-certificates

from scratch
RUN mkdir /app
RUN mkdir /app_sdk

# Required files for code generation
ADD ./app_sdk/app_sdk.py /app_sdk
ADD ./app_sdk/static_baseline.py /app_sdk

COPY --from=builder /app/ /app
COPY --from=certs /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt

WORKDIR /app
EXPOSE 5001
CMD ["./webapp"]
