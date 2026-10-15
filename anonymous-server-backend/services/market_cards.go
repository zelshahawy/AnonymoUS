package services

import "encoding/json"

type marketQuote struct {
	Symbol string  `json:"symbol"`
	Price  float64 `json:"price"`
	Change float64 `json:"change"`
}

type marketArticle struct {
	Title  string `json:"title"`
	Source string `json:"source,omitempty"`
	URL    string `json:"url,omitempty"`
}

func marketCardResponse(context string, data any) []BotResponse {
	payload, err := json.Marshal(data)
	if err != nil {
		return []BotResponse{{From: "bot", Body: friendlyError(context, err)}}
	}
	return []BotResponse{{From: "bot", Body: "MARKET_DATA:" + string(payload)}}
}

func marketListResponse(kind string, items []marketQuote) []BotResponse {
	if items == nil {
		items = []marketQuote{}
	}
	return marketCardResponse(kind, struct {
		Kind  string        `json:"kind"`
		Items []marketQuote `json:"items"`
	}{Kind: kind, Items: items})
}
