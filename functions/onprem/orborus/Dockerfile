FROM golang:1.22 as builder

WORKDIR /app

# COPY go.* ./
COPY orborus.go /app/orborus.go
COPY go.mod /app/go.mod

RUN go get

#RUN go mod tidy 
RUN go build
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o orborus .

FROM alpine:3.15.0
RUN apk add --no-cache bash tzdata
COPY --from=builder /app/orborus /
ENV ENVIRONMENT_NAME=Shuffle \
    BASE_URL=http://shuffle-backend:5001 \
    DOCKER_API_VERSION=1.40 \
    SHUFFLE_OPENSEARCH_URL=https://opensearch:9200
CMD ["./orborus"]
