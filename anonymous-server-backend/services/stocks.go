package services

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/zelshahawy/Anonymous_backend/config"
	"github.com/zelshahawy/Anonymous_backend/internal/hub"
)

// StockResponse mirrors your Python API response
type StockResponse struct {
	Symbol string  `json:"symbol"`
	Price  float64 `json:"price"`
	Change float64 `json:"change"`
	EMA20  float64 `json:"ema20"`
}

var stockAPI = config.Config().GetString("stock_api")

// parseStockCommand returns the ticker symbol if text starts with /stocks
func parseStockCommand(text string) (symbol string, ok bool) {
	parts := strings.Fields(text)
	if len(parts) == 2 && parts[0] == "/stocks" {
		return strings.ToUpper(parts[1]), true
	}
	return "", false
}

func stockMovers(text string) (ok bool) {
	parts := strings.Fields(text)
	if len(parts) == 1 && parts[0] == "/top-movers" {
		return true
	}
	return false
}

// fetchStock hits your FastAPI service and decodes the JSON
func fetchStock(symbol string) (*StockResponse, error) {
	client := http.Client{Timeout: 5 * time.Second}
	resp, err := client.Get(stockAPI + "/api/stocks/" + symbol)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("service returned %d", resp.StatusCode)
	}
	var out StockResponse
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return nil, err
	}
	return &out, nil
}

func fetchTopMovers() ([]StockResponse, error) {
	client := http.Client{Timeout: 5 * time.Second}
	resp, err := client.Get(stockAPI + "/api/top-movers/")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("service returned %d", resp.StatusCode)
	}
	var out []StockResponse
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return nil, err
	}
	return out, nil
}

// httpGetJSON performs a GET and decodes JSON into out
func httpGetJSON(url string, out interface{}) error {
	client := http.Client{Timeout: 5 * time.Second}
	resp, err := client.Get(url)
	if err != nil {
		log.Printf("httpGetJSON GET error: %v url=%s", err, url)
		return err
	}
	defer resp.Body.Close()

	bodyBytes, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		log.Printf("httpGetJSON non-OK response: status=%d url=%s body=%s", resp.StatusCode, url, string(bodyBytes))
		return fmt.Errorf("service returned %d: %s", resp.StatusCode, string(bodyBytes))
	}

	if err := json.Unmarshal(bodyBytes, out); err != nil {
		log.Printf("httpGetJSON decode error: %v url=%s body=%s", err, url, string(bodyBytes))
		return err
	}
	return nil
}

// formatStockLines formats an array of simple stock maps into lines
func formatStockLines(title string, stocks []map[string]interface{}, limit int) string {
	lines := []string{title, ""}
	for i, s := range stocks {
		if i >= limit {
			break
		}
		sym, _ := s["symbol"].(string)
		price, _ := s["price"].(float64)
		change, _ := s["change"].(float64)
		emoji := "🔴"
		if change > 0 {
			emoji = "🟢"
		}
		lines = append(lines, fmt.Sprintf("%s **%s** $%.2f (%+.1f%%)", emoji, sym, price, change))
	}
	return strings.Join(lines, "\n")
}

// formatNewsLines formats news items into a compact list
func formatNewsLines(sym string, news []map[string]interface{}, limit int) string {
	lines := []string{}
	if sym != "" {
		lines = append(lines, fmt.Sprintf("📰 **%s News:**", sym))
	} else {
		lines = append(lines, "📰 **Market News:**")
	}
	lines = append(lines, "")
	for i, a := range news {
		if i >= limit {
			break
		}
		title, _ := a["title"].(string)
		if len(title) > 100 {
			title = title[:100] + "..."
		}
		lines = append(lines, fmt.Sprintf("• %s", title))
	}
	return strings.Join(lines, "\n")
}

type BotResponse struct {
	From string
	Body string
}

// HandleStockCommand returns zero or one "bot" message in response to a stock command
func HandleStockCommand(in *hub.Message) []BotResponse {
	sym, ok := parseStockCommand(in.Body)
	if !ok {
		return nil
	}

	data, err := fetchStock(sym)
	var text string
	if err != nil {
		text = fmt.Sprintf("❌ Could not fetch %s: %v", sym, err)
	} else {
		text = fmt.Sprintf("📈 %s  Price: $%.2f  Change: %.2f%%  EMA20: $%.2f",
			data.Symbol, data.Price, data.Change, data.EMA20)
	}

	return []BotResponse{{
		From: "bot",
		Body: text,
	}}
}

func HandleTopMoversCommand(in *hub.Message) []BotResponse {
	ok := stockMovers(in.Body)
	if !ok {
		return nil
	}

	data, err := fetchTopMovers()
	var text string
	if err != nil {
		text = fmt.Sprintf("❌ Could not fetch top movers: %v", err)
	} else {
		var lines []string
		lines = append(lines, "📊 **Top Movers Today**")
		lines = append(lines, "")

		// Separate gainers and losers
		var gainers []StockResponse
		var losers []StockResponse

		for _, stock := range data {
			if stock.Change > 0 {
				gainers = append(gainers, stock)
			} else {
				losers = append(losers, stock)
			}
		}

		// Add top 3 gainers
		lines = append(lines, "🟢 **Top Gainers:**")
		maxGainers := 3
		if len(gainers) > maxGainers {
			gainers = gainers[:maxGainers]
		}
		for _, stock := range gainers {
			line := fmt.Sprintf("**%s** $%.2f (+%.1f%%)",
				stock.Symbol, stock.Price, stock.Change)
			lines = append(lines, line)
		}

		lines = append(lines, "")

		// Add top 3 losers
		lines = append(lines, "🔴 **Top Losers:**")
		maxLosers := 3
		if len(losers) > maxLosers {
			losers = losers[:maxLosers]
		}
		for _, stock := range losers {
			line := fmt.Sprintf("**%s** $%.2f (%.1f%%)",
				stock.Symbol, stock.Price, stock.Change)
			lines = append(lines, line)
		}

		text = strings.Join(lines, "\n")
	}

	return []BotResponse{{
		From: "bot",
		Body: text,
	}}
}

// parseNewsCommand returns the symbol if text starts with /news
func parseNewsCommand(text string) (symbol string, ok bool) {
	parts := strings.Fields(text)
	if len(parts) >= 1 && parts[0] == "/news" {
		if len(parts) == 2 {
			return strings.ToUpper(parts[1]), true
		}
		return "", true
	}
	return "", false
}

// HandleNewsCommand returns bot messages for news commands
func HandleNewsCommand(in *hub.Message) []BotResponse {
	sym, ok := parseNewsCommand(in.Body)
	if !ok {
		return nil
	}

	var newsData []map[string]interface{}
	url := stockAPI + "/api/news?limit=5"
	if sym != "" {
		url = stockAPI + "/api/news?symbol=" + sym + "&limit=3"
	}
	if err := httpGetJSON(url, &newsData); err != nil {
		return []BotResponse{{From: "bot", Body: fmt.Sprintf("❌ Could not fetch news: %v", err)}}
	}

	return []BotResponse{{From: "bot", Body: formatNewsLines(sym, newsData, 3)}}
}

// parseCryptoCommand checks for /crypto
func parseCryptoCommand(text string) bool {
	parts := strings.Fields(text)
	return len(parts) == 1 && parts[0] == "/crypto"
}

// HandleCryptoCommand returns crypto prices
func HandleCryptoCommand(in *hub.Message) []BotResponse {
	if !parseCryptoCommand(in.Body) {
		return nil
	}

	var cryptoData []map[string]interface{}
	if err := httpGetJSON(stockAPI+"/api/crypto", &cryptoData); err != nil {
		return []BotResponse{{From: "bot", Body: fmt.Sprintf("❌ Could not fetch crypto data: %v", err)}}
	}

	return []BotResponse{{From: "bot", Body: formatStockLines("₿ **Crypto Prices:**", cryptoData, len(cryptoData))}}
}

// parseIndicesCommand checks for /indices
func parseIndicesCommand(text string) bool {
	parts := strings.Fields(text)
	return len(parts) == 1 && parts[0] == "/indices"
}

// HandleIndicesCommand returns market indices
func HandleIndicesCommand(in *hub.Message) []BotResponse {
	if !parseIndicesCommand(in.Body) {
		return nil
	}

	var idx map[string]map[string]interface{}
	if err := httpGetJSON(stockAPI+"/api/indices", &idx); err != nil {
		return []BotResponse{{From: "bot", Body: fmt.Sprintf("❌ Could not fetch indices data: %v", err)}}
	}

	// convert to slice of maps for formatting
	vals := []map[string]interface{}{}
	for _, v := range idx {
		vals = append(vals, v)
	}

	return []BotResponse{{From: "bot", Body: formatStockLines("📊 **Market Indices:**", vals, len(vals))}}
}

// parseTrendingCommand checks for /trending
func parseTrendingCommand(text string) bool {
	parts := strings.Fields(text)
	return len(parts) == 1 && parts[0] == "/trending"
}

// HandleTrendingCommand returns trending stocks
func HandleTrendingCommand(in *hub.Message) []BotResponse {
	if !parseTrendingCommand(in.Body) {
		return nil
	}

	var trending []map[string]interface{}
	if err := httpGetJSON(stockAPI+"/api/trending", &trending); err != nil {
		return []BotResponse{{From: "bot", Body: fmt.Sprintf("❌ Could not fetch trending data: %v", err)}}
	}

	return []BotResponse{{From: "bot", Body: formatStockLines("🔥 **Trending Stocks:**", trending, 5)}}
}
