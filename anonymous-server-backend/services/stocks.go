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

func friendlyError(context string, err error) string {
	msg := err.Error()
	switch {
	case strings.Contains(msg, "no such host"),
		strings.Contains(msg, "connection refused"),
		strings.Contains(msg, "dial tcp"):
		return "Couldn't reach the market data service right now. Try again in a bit!"
	case strings.Contains(msg, "timeout"),
		strings.Contains(msg, "deadline exceeded"):
		return "The request timed out. The market data service might be slow — give it another shot!"
	case strings.Contains(msg, "service returned 404"):
		return fmt.Sprintf("Couldn't find data for **%s**. Double-check the symbol and try again.", context)
	case strings.Contains(msg, "service returned 5"),
		strings.Contains(msg, "service returned 502"),
		strings.Contains(msg, "service returned 503"):
		return "The market data service is having issues. Hang tight and try again shortly!"
	case strings.Contains(msg, "service returned 429"):
		return "Too many requests — slow down a bit and try again in a few seconds."
	case strings.Contains(msg, "unmarshal"),
		strings.Contains(msg, "decode"):
		return "Got an unexpected response from the market data service. Try again later."
	default:
		return fmt.Sprintf("Something went wrong fetching %s. Try again in a moment!", context)
	}
}

// StockResponse mirrors your Python API response
type StockResponse struct {
	Symbol string  `json:"symbol"`
	Price  float64 `json:"price"`
	Change float64 `json:"change"`
	EMA20  float64 `json:"ema20"`
}

var stockAPI = config.Config().GetString("stock_api")

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

func fetchTopMovers() ([]marketQuote, error) {
	client := http.Client{Timeout: 5 * time.Second}
	resp, err := client.Get(stockAPI + "/api/top-movers/")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("service returned %d", resp.StatusCode)
	}
	var out []marketQuote
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return nil, err
	}
	return out, nil
}

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

type BotResponse struct {
	From string
	Body string
}

func HandleStockCommand(in *hub.Message) []BotResponse {
	sym, ok := parseStockCommand(in.Body)
	if !ok {
		return nil
	}

	data, err := fetchStock(sym)
	var text string
	if err != nil {
		text = friendlyError(sym, err)
	} else {
		quote, err := json.Marshal(data)
		if err != nil {
			text = friendlyError(sym, err)
		} else {
			text = "STOCK_DATA:" + string(quote)
		}
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
	if err != nil {
		return []BotResponse{{From: "bot", Body: friendlyError("top movers", err)}}
	}
	return marketListResponse("top-movers", data)
}

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

func HandleNewsCommand(in *hub.Message) []BotResponse {
	sym, ok := parseNewsCommand(in.Body)
	if !ok {
		return nil
	}

	newsData := []marketArticle{}
	url := stockAPI + "/api/news?limit=5"
	if sym != "" {
		url = stockAPI + "/api/news?symbol=" + sym + "&limit=3"
	}
	if err := httpGetJSON(url, &newsData); err != nil {
		return []BotResponse{{From: "bot", Body: friendlyError("news", err)}}
	}

	if len(newsData) > 3 {
		newsData = newsData[:3]
	}
	if newsData == nil {
		newsData = []marketArticle{}
	}
	return marketCardResponse("news", struct {
		Kind     string          `json:"kind"`
		Symbol   string          `json:"symbol,omitempty"`
		Articles []marketArticle `json:"articles"`
	}{Kind: "news", Symbol: sym, Articles: newsData})
}

func parseCryptoCommand(text string) bool {
	parts := strings.Fields(text)
	return len(parts) == 1 && parts[0] == "/crypto"
}

func HandleCryptoCommand(in *hub.Message) []BotResponse {
	if !parseCryptoCommand(in.Body) {
		return nil
	}

	var cryptoData []marketQuote
	if err := httpGetJSON(stockAPI+"/api/crypto", &cryptoData); err != nil {
		return []BotResponse{{From: "bot", Body: friendlyError("crypto", err)}}
	}

	return marketListResponse("crypto", cryptoData)
}

// Extra arguments (e.g. "/indices NASDAQ") are accepted but ignored.
func parseIndicesCommand(text string) bool {
	parts := strings.Fields(text)
	return len(parts) >= 1 && parts[0] == "/indices"
}

func HandleIndicesCommand(in *hub.Message) []BotResponse {
	if !parseIndicesCommand(in.Body) {
		return nil
	}

	var idx map[string]*struct {
		Name   string   `json:"name"`
		Value  *float64 `json:"value"`
		Change *float64 `json:"change"`
	}
	if err := httpGetJSON(stockAPI+"/api/indices", &idx); err != nil {
		return []BotResponse{{From: "bot", Body: friendlyError("indices", err)}}
	}

	// Preserve benchmark order and skip unavailable indices instead of displaying zeroes.
	order := []string{"sp500", "dow_jones", "nasdaq"}
	vals := []marketQuote{}
	for _, key := range order {
		v := idx[key]
		if v == nil || strings.TrimSpace(v.Name) == "" || v.Value == nil || v.Change == nil {
			continue
		}
		vals = append(vals, marketQuote{
			Symbol: v.Name,
			Price:  *v.Value,
			Change: *v.Change,
		})
	}

	return marketListResponse("indices", vals)
}

// Maps user-friendly period inputs to the canonical periods the market-data service understands.
var chartPeriodAliases = map[string]string{
	"1d": "1d", "1day": "1d", "today": "1d",
	"5d": "5d", "1w": "5d", "1week": "5d",
	"1mo": "1mo", "1m": "1mo", "1month": "1mo", "30d": "1mo",
	"3mo": "3mo", "3m": "3mo", "3month": "3mo",
	"6mo": "6mo", "6m": "6mo", "6month": "6mo",
	"ytd": "ytd",
	"1y":  "1y", "1yr": "1y", "1year": "1y", "12mo": "1y", "12m": "1y",
	"2y": "2y", "2yr": "2y", "2year": "2y",
	"5y": "5y", "5yr": "5y", "5year": "5y",
	"10y": "10y", "10yr": "10y", "10year": "10y",
	"max": "max", "all": "max",
}

const chartPeriodOptions = "1d, 5d, 1mo, 3mo, 6mo, ytd, 1y, 2y, 5y, 10y, max"

func parseChartCommand(text string) (symbol string, period string, ok bool) {
	parts := strings.Fields(text)
	if len(parts) < 2 || parts[0] != "/chart" {
		return "", "", false
	}
	symbol = strings.ToUpper(parts[1])
	period = "1mo"
	if len(parts) >= 3 {
		// Join the remaining tokens so "12 mo" collapses to "12mo".
		period = strings.ToLower(strings.Join(parts[2:], ""))
	}
	return symbol, period, true
}

func HandleChartCommand(in *hub.Message) []BotResponse {
	sym, period, ok := parseChartCommand(in.Body)
	if !ok {
		return nil
	}

	canonical, valid := chartPeriodAliases[period]
	if !valid {
		return []BotResponse{{
			From: "bot",
			Body: fmt.Sprintf("**%s** isn't a period I recognize. Try one of: %s\n\nFor example: **/chart %s 6mo**", period, chartPeriodOptions, sym),
		}}
	}

	url := fmt.Sprintf("%s/api/chart/%s?period=%s", stockAPI, sym, canonical)
	var chartData json.RawMessage
	if err := httpGetJSON(url, &chartData); err != nil {
		return []BotResponse{{From: "bot", Body: friendlyError(sym, err)}}
	}

	return []BotResponse{{
		From: "bot",
		Body: "CHART_DATA:" + string(chartData),
	}}
}

func parseTrendingCommand(text string) bool {
	parts := strings.Fields(text)
	return len(parts) == 1 && parts[0] == "/trending"
}

func HandleTrendingCommand(in *hub.Message) []BotResponse {
	if !parseTrendingCommand(in.Body) {
		return nil
	}

	var trending []marketQuote
	if err := httpGetJSON(stockAPI+"/api/trending", &trending); err != nil {
		return []BotResponse{{From: "bot", Body: friendlyError("trending", err)}}
	}

	if len(trending) > 5 {
		trending = trending[:5]
	}
	return marketListResponse("trending", trending)
}
