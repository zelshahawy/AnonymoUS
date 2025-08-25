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
