FROM golang:1.25 AS builder

RUN mkdir /app /app_sdk
WORKDIR /app

COPY ./go-app/go.mod ./go-app/go.sum ./
RUN go mod download

COPY ./go-app/main.go ./go-app/walkoff.go ./go-app/docker.go ./
COPY ./app_gen /app_gen

RUN wget -O /app_sdk/app_base.py https://raw.githubusercontent.com/Shuffle/app_sdk/refs/heads/main/shuffle_sdk/shuffle_sdk.py

RUN go mod tidy
RUN CGO_ENABLED=0 GOOS=linux go build -o shufflebackend .

FROM alpine:3.22.2
RUN apk add --no-cache libc6-compat libstdc++ ca-certificates

COPY --from=builder /app/shufflebackend /app/shufflebackend
COPY --from=builder /app_sdk/ /app_sdk
COPY --from=builder /app_gen/ /app_gen

WORKDIR /app
EXPOSE 5001
CMD ["./shufflebackend"]
