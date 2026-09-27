FROM golang:1.24-alpine AS builder
RUN apk add --no-cache git build-base

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix nocgo \
    -ldflags="-w -s" \
    -o bin/Anonymous_backend .

FROM alpine:latest

RUN apk add --no-cache ca-certificates

COPY --from=builder /app/bin/Anonymous_backend /usr/local/bin/Anonymous_backend

USER nobody:nobody

EXPOSE 8080

ENTRYPOINT ["Anonymous_backend"]
