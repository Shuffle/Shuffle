# Build environment
# production environment
from golang as builder

RUN go get github.com/gorilla/handlers 
RUN go get github.com/gorilla/mux 

WORKDIR /app
COPY webhook.go /app/webhook.go
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o webhook .

from scratch
COPY --from=builder /app/ /

CMD ["./webhook"]
