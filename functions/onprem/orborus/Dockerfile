FROM golang:1.17.2-buster as builder

RUN mkdir /app
WORKDIR /app

COPY orborus.go /app/orborus.go
RUN go mod init orborus 
RUN go get github.com/docker/docker/api/types && \
    go get github.com/docker/docker/api/types/container && \
    go get github.com/docker/docker/client && \
    go get github.com/mackerelio/go-osstat/cpu && \
    go get github.com/mackerelio/go-osstat/memory && \
    go get github.com/satori/go.uuid && \
    go get github.com/shuffle/shuffle-shared
RUN go build
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o orborus .

FROM alpine:3.15.0
RUN apk add --no-cache bash tzdata
COPY --from=builder /app/ /

CMD ["./orborus"]
