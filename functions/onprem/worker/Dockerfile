from golang as builder

WORKDIR /app

RUN go get -u github.com/docker/docker/api/types 
RUN go get -u github.com/docker/docker/api/types/container
RUN go get -u github.com/docker/docker/client

COPY worker.go /app/worker.go
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o worker .

FROM alpine:3.12

ENV SHUFFLE_BASE_IMAGE_REGISTRY=docker.io
ENV SHUFFLE_BASE_IMAGE_NAME=frikky/shuffle
ENV SHUFFLE_BASE_IMAGE_TAG_SUFFIX=0.6.0

RUN apk add --no-cache bash
COPY --from=builder /app/ /

CMD ["./worker"]
