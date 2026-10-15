package services

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/zelshahawy/Anonymous_backend/internal/hub"
)

func TestMarketCommandCards(t *testing.T) {
	tests := []struct {
		command  string
		path     string
		upstream string
		kind     string
		count    int
		handle   func(*hub.Message) []BotResponse
	}{
		{"/indices", "/api/indices", `{"sp500":{"name":"S&P 500","value":6750.25,"change":0.52},"dow_jones":null,"nasdaq":{"name":"Nasdaq Composite","value":null,"change":0.1}}`, "indices", 1, HandleIndicesCommand},
		{"/crypto", "/api/crypto", `[{"symbol":"BTC","price":105000.27,"change":-0.15,"volume":1000},{"symbol":"ADA","price":0.42,"change":0}]`, "crypto", 2, HandleCryptoCommand},
		{"/top-movers", "/api/top-movers/", `[{"symbol":"UP","price":20.01,"change":5.53},{"symbol":"DOWN","price":12.34,"change":-4.52}]`, "top-movers", 2, HandleTopMoversCommand},
		{"/trending", "/api/trending", `[{"symbol":"A","price":1,"change":1},{"symbol":"B","price":2,"change":2},{"symbol":"C","price":3,"change":3},{"symbol":"D","price":4,"change":4},{"symbol":"E","price":5,"change":5},{"symbol":"F","price":6,"change":6}]`, "trending", 5, HandleTrendingCommand},
		{"/crypto", "/api/crypto", `null`, "crypto", 0, HandleCryptoCommand},
	}
	for _, tt := range tests {
		t.Run(tt.command, func(t *testing.T) {
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if r.URL.Path != tt.path {
					t.Errorf("unexpected API path: %s", r.URL.Path)
				}
				w.Header().Set("Content-Type", "application/json")
				_, _ = w.Write([]byte(tt.upstream))
			}))
			defer server.Close()
			previousAPI := stockAPI
			stockAPI = server.URL
			t.Cleanup(func() { stockAPI = previousAPI })

			responses := tt.handle(&hub.Message{Body: tt.command})
			if len(responses) != 1 || responses[0].From != "bot" || !strings.HasPrefix(responses[0].Body, "MARKET_DATA:") {
				t.Fatalf("expected one structured bot response, got %+v", responses)
			}
			var card struct {
				Kind  string        `json:"kind"`
				Items []marketQuote `json:"items"`
			}
			if err := json.Unmarshal([]byte(strings.TrimPrefix(responses[0].Body, "MARKET_DATA:")), &card); err != nil {
				t.Fatal(err)
			}
			if card.Kind != tt.kind || card.Items == nil || len(card.Items) != tt.count {
				t.Fatalf("unexpected card: %+v", card)
			}
			if tt.kind == "indices" && (card.Items[0].Symbol != "S&P 500" || card.Items[0].Price != 6750.25) {
				t.Fatalf("unavailable benchmarks must be skipped without inventing zero values: %+v", card.Items)
			}
			if tt.kind == "crypto" && tt.count > 0 && (card.Items[0].Price != 105000.27 || card.Items[0].Change != -0.15) {
				t.Fatalf("quote precision was lost: %+v", card.Items[0])
			}
		})
	}
}

func TestNewsCardPreservesFullHeadlinesAndSources(t *testing.T) {
	title := strings.Repeat("Markets — earnings and growth. ", 6)
	article := marketArticle{Title: title, Source: "Example News", URL: "https://example.com/story"}
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Query().Get("symbol") != "AAPL" {
			t.Errorf("expected symbol-specific news request, got %s", r.URL)
		}
		_ = json.NewEncoder(w).Encode([]marketArticle{article, article, article, article})
	}))
	defer server.Close()
	previousAPI := stockAPI
	stockAPI = server.URL
	t.Cleanup(func() { stockAPI = previousAPI })

	responses := HandleNewsCommand(&hub.Message{Body: "/news aapl"})
	var card struct {
		Kind     string          `json:"kind"`
		Symbol   string          `json:"symbol"`
		Articles []marketArticle `json:"articles"`
	}
	if len(responses) != 1 {
		t.Fatalf("expected one news response, got %+v", responses)
	}
	if err := json.Unmarshal([]byte(strings.TrimPrefix(responses[0].Body, "MARKET_DATA:")), &card); err != nil {
		t.Fatal(err)
	}
	if card.Kind != "news" || card.Symbol != "AAPL" || len(card.Articles) != 3 || card.Articles[0] != article {
		t.Fatalf("news card must preserve full headlines, source, and URL, with three articles: %+v", card)
	}
}

func TestMarketServiceErrorsRemainReadable(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusServiceUnavailable)
	}))
	defer server.Close()
	previousAPI := stockAPI
	stockAPI = server.URL
	t.Cleanup(func() { stockAPI = previousAPI })
	for command, handle := range map[string]func(*hub.Message) []BotResponse{
		"/indices":    HandleIndicesCommand,
		"/crypto":     HandleCryptoCommand,
		"/trending":   HandleTrendingCommand,
		"/top-movers": HandleTopMoversCommand,
		"/news":       HandleNewsCommand,
	} {
		responses := handle(&hub.Message{Body: command})
		if len(responses) != 1 || !strings.Contains(responses[0].Body, "having issues") {
			t.Errorf("expected readable service error for %s, got %+v", command, responses)
		}
	}
}
