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

// HandleStockCommand returns zero or one “bot” messages in response to a stock command
func HandleStockCommand(in *hub.Message) []*hub.Message {
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

	return []*hub.Message{{
		From:      in.From,
		To:        in.To,
		Messageid: in.Messageid,
		Body:      text,
	}}
}
