from golang as builder

RUN mkdir /app
WORKDIR /app
COPY orborus.go /app/orborus.go

RUN go get github.com/docker/docker/api/types github.com/docker/docker/api/types/container github.com/docker/docker/client

RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o orborus .

from scratch
COPY --from=builder /app/ /

CMD ["./orborus"]
