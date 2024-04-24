FROM golang:1.22 as builder

RUN mkdir /app
WORKDIR /app

COPY orborus.go /app/orborus.go
#COPY go.mod /app/go.mod
#COPY go.sum /app/go.sum
RUN go mod init orborus 

RUN go get github.com/docker/docker/api/types 
RUN go get github.com/docker/docker/api/types/container 
#RUN go get github.com/docker/docker/client 
RUN go get github.com/mackerelio/go-osstat/cpu 
RUN go get github.com/mackerelio/go-osstat/memory 
RUN go get github.com/satori/go.uuid 
RUN go get github.com/shuffle/shuffle-shared 
RUN	go get github.com/shirou/gopsutil 
RUN go get k8s.io/client-go
RUN go get k8s.io/apimachinery

RUN go get
RUN go mod tidy 
RUN go build
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o orborus .

FROM alpine:3.15.0
RUN apk add --no-cache bash tzdata
COPY --from=builder /app/ /

ENV ENVIRONMENT_NAME=Shuffle
ENV BASE_URL=http://shuffle-backend:5001
ENV DOCKER_API_VERSION=1.40
ENV SHUFFLE_OPENSEARCH_URL=https://opensearch:9200

CMD ["./orborus"]
