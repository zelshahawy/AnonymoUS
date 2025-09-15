package services

import (
	"encoding/json"
	"fmt"
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

// parseNewsCommand returns the symbol (optional) if text starts with /news
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

	client := http.Client{Timeout: 5 * time.Second}
	var url string
	if sym != "" {
		url = stockAPI + "/api/news?symbol=" + sym + "&limit=3"
	} else {
		url = stockAPI + "/api/news?limit=5"
	}

	resp, err := client.Get(url)
	if err != nil {
		return []BotResponse{{From: "bot", Body: fmt.Sprintf("❌ Could not fetch news: %v", err)}}
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return []BotResponse{{From: "bot", Body: fmt.Sprintf("❌ News service error: %d", resp.StatusCode)}}
	}

	var newsData []map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&newsData); err != nil {
		return []BotResponse{{From: "bot", Body: fmt.Sprintf("❌ Could not parse news data: %v", err)}}
	}

	lines := []string{}
	if sym != "" {
		lines = append(lines, fmt.Sprintf("📰 **%s News:**", sym))
	} else {
		lines = append(lines, "📰 **Market News:**")
	}
	lines = append(lines, "")
	for i, a := range newsData {
		if i >= 3 {
			break
		}
		title, _ := a["title"].(string)
		if len(title) > 100 {
			title = title[:100] + "..."
		}
		lines = append(lines, fmt.Sprintf("• %s", title))
	}

	return []BotResponse{{From: "bot", Body: strings.Join(lines, "\n")}}
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
	client := http.Client{Timeout: 5 * time.Second}
	resp, err := client.Get(stockAPI + "/api/crypto")
	if err != nil {
		return []BotResponse{{From: "bot", Body: fmt.Sprintf("❌ Could not fetch crypto data: %v", err)}}
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return []BotResponse{{From: "bot", Body: fmt.Sprintf("❌ Crypto service error: %d", resp.StatusCode)}}
	}

	var cryptoData []map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&cryptoData); err != nil {
		return []BotResponse{{From: "bot", Body: fmt.Sprintf("❌ Could not parse crypto data: %v", err)}}
	}

	lines := []string{"₿ **Crypto Prices:**", ""}
	for _, c := range cryptoData {
		sym, _ := c["symbol"].(string)
		price, _ := c["price"].(float64)
		change, _ := c["change"].(float64)
		emoji := "🔴"
		if change > 0 {
			emoji = "🟢"
		}
		lines = append(lines, fmt.Sprintf("%s **%s** $%.2f (%+.1f%%)", emoji, sym, price, change))
	}

	return []BotResponse{{From: "bot", Body: strings.Join(lines, "\n")}}
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
	client := http.Client{Timeout: 5 * time.Second}
	resp, err := client.Get(stockAPI + "/api/indices")
	if err != nil {
		return []BotResponse{{From: "bot", Body: fmt.Sprintf("❌ Could not fetch indices data: %v", err)}}
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return []BotResponse{{From: "bot", Body: fmt.Sprintf("❌ Indices service error: %d", resp.StatusCode)}}
	}

	var idx map[string]map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&idx); err != nil {
		return []BotResponse{{From: "bot", Body: fmt.Sprintf("❌ Could not parse indices data: %v", err)}}
	}

	lines := []string{"📊 **Market Indices:**", ""}
	for _, v := range idx {
		name, _ := v["name"].(string)
		value, _ := v["value"].(float64)
		change, _ := v["change"].(float64)
		emoji := "🔴"
		if change > 0 {
			emoji = "🟢"
		}
		lines = append(lines, fmt.Sprintf("%s **%s** %.2f (%+.1f%%)", emoji, name, value, change))
	}

	return []BotResponse{{From: "bot", Body: strings.Join(lines, "\n")}}
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
	client := http.Client{Timeout: 5 * time.Second}
	resp, err := client.Get(stockAPI + "/api/trending")
	if err != nil {
		return []BotResponse{{From: "bot", Body: fmt.Sprintf("❌ Could not fetch trending data: %v", err)}}
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return []BotResponse{{From: "bot", Body: fmt.Sprintf("❌ Trending service error: %d", resp.StatusCode)}}
	}

	var trending []map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&trending); err != nil {
		return []BotResponse{{From: "bot", Body: fmt.Sprintf("❌ Could not parse trending data: %v", err)}}
	}

	lines := []string{"🔥 **Trending Stocks:**", ""}
	for i, s := range trending {
		if i >= 5 {
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

	return []BotResponse{{From: "bot", Body: strings.Join(lines, "\n")}}
}
