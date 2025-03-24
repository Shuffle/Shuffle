FROM golang:1.23 as builder

WORKDIR /app

COPY orborus.go /app/orborus.go
COPY go.mod /app/go.mod

#RUN go get
RUN go mod download
RUN go mod tidy 
#RUN go build -v

# Enabled CGO January 2025 (?)
#RUN CGO_ENABLED=1 GOOS=linux go build -a -installsuffix cgo -o orborus.
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o /app/orborus .

FROM alpine:3.21.2

RUN apk add --no-cache bash tzdata
#COPY --from=builder /app/orborus orborus
COPY --from=builder /app/ /
ENV ENVIRONMENT_NAME=Shuffle \
    BASE_URL=http://shuffle-backend:5001 \
    DOCKER_API_VERSION=1.40 \
    SHUFFLE_OPENSEARCH_URL=https://opensearch:9200

CMD ["./orborus"]
