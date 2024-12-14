FROM golang:1.22 as builder

WORKDIR /app

# Copy go.mod and go.sum first (if you have them)
# This allows better caching of dependencies
# COPY go.* ./
RUN go mod init orborus

# Combine all go get commands into a single layer
RUN go get \
    github.com/docker/docker/api/types \
    github.com/docker/docker/api/types/container \
    github.com/mackerelio/go-osstat/cpu \
    github.com/mackerelio/go-osstat/memory \
    github.com/satori/go.uuid \
    github.com/shuffle/shuffle-shared \
    github.com/shirou/gopsutil

# Copy the rest of the code
COPY orborus.go .

RUN go mod tidy && \
    CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o orborus .

FROM alpine:3.15.0
RUN apk add --no-cache bash tzdata
COPY --from=builder /app/orborus /
ENV ENVIRONMENT_NAME=Shuffle \
    BASE_URL=http://shuffle-backend:5001 \
    DOCKER_API_VERSION=1.40 \
    SHUFFLE_OPENSEARCH_URL=https://opensearch:9200
CMD ["./orborus"]