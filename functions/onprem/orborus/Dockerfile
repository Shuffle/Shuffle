from golang as builder

RUN mkdir /app
WORKDIR /app
COPY orborus.go /app/orborus.go

RUN go get github.com/docker/docker/api/types github.com/docker/docker/api/types/container github.com/docker/docker/client

RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o orborus .

FROM alpine:3.12
COPY --from=builder /app/ /
RUN apk add --no-cache curl bash

COPY ./entrypoint.sh /
ENTRYPOINT [ "/entrypoint.sh" ]
CMD ["./orborus"]
