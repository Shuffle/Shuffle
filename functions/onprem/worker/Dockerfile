from golang as builder

WORKDIR /app

RUN go get github.com/docker/docker/api/types && \
    go get github.com/docker/docker/api/types/container && \
    go get -u github.com/docker/docker/client

COPY worker.go /app/worker.go
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o worker .


# THis is a workaround until I get docker/docker to build in a dockerfile
# PS: This is tricky to google.
# Might not work on some machines.
FROM alpine:3.12
RUN apk add --no-cache curl jq bash
COPY --from=builder /app/ /
# COPY worker.bin /worker.bin

CMD ["./worker"]
