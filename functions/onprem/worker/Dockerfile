#from golang as builder
#
#RUN mkdir /app
#WORKDIR /app
#COPY worker.go /app/worker.go
#
#RUN go get github.com/docker/docker/api/types 
#RUN go get github.com/docker/docker/api/types/container 
#RUN go get -u github.com/docker/docker/client
#
#RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o worker .
#

# THis is a workaround until I get docker/docker to build in a dockerfile
# PS: This is tricky to google.
# Might not work on some machines.
from scratch
#COPY --from=builder /app/ /
COPY worker.bin /worker.bin

CMD ["./worker.bin"]
