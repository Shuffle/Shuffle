from golang as builder

RUN mkdir /app
WORKDIR /app
RUN go get github.com/docker/docker/api/types github.com/docker/docker/api/types/container github.com/docker/docker/client

COPY orborus.go /app/orborus.go
RUN go mod init orborus 
RUN go build
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o orborus .

FROM alpine:3.12
RUN apk add --no-cache bash
COPY --from=builder /app/ /

CMD ["./orborus"]
