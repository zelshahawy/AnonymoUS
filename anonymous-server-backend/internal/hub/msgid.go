package hub

import (
	"math/rand"
	"time"

	"github.com/oklog/ulid/v2"
)

var entropy = ulid.Monotonic(rand.New(rand.NewSource(time.Now().UnixNano())), 0)

func GenerateMessageID() string {
	id, err := ulid.New(ulid.Timestamp(time.Now()), entropy)
	if err != nil {
		panic(err)
	}
	return id.String() // e.g. "01ARZ3NDEKTSV4RRFFQ69G5FAV"
}
