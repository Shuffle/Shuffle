FROM golang:1.25 AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY worker.go ./
RUN go mod tidy
RUN CGO_ENABLED=0 GOOS=linux go build -o worker .

FROM alpine:3.22.2

ENV SHUFFLE_BASE_IMAGE_REGISTRY=docker.io
ENV SHUFFLE_BASE_IMAGE_NAME=frikky/shuffle
ENV SHUFFLE_BASE_IMAGE_TAG_SUFFIX=0.8.70
ENV SHUFFLE_OPENSEARCH_URL=https://opensearch:9200
ENV SHUFFLE_OPENSEARCH_SKIPSSL_VERIFY=true

RUN apk add --no-cache bash tzdata ca-certificates

WORKDIR /app
COPY --from=builder /app/worker /app/worker

CMD ["./worker"]
