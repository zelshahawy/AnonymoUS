FROM golang:1.20-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN go build -o server .

FROM alpine:3.18
WORKDIR /app
COPY --from=builder /app/server .
EXPOSE 8081
ENTRYPOINT ["./server"]
