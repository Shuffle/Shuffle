from golang as builder

# Add files
RUN mkdir /app
WORKDIR /app
ADD ./go-app/main.go /app
ADD ./go-app/walkoff.go /app
ADD ./go-app/docker.go /app
ADD ./go-app/codegen.go /app

ADD ./go-app/go.mod /app

RUN go get -v

RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o webapp .

# Certificate build
FROM alpine:latest as certs
RUN apk --update add ca-certificates

from scratch
COPY --from=builder /app/ /
COPY --from=certs /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt

EXPOSE 5001
CMD ["./webapp"]
