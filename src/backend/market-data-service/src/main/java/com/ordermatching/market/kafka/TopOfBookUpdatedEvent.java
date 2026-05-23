package com.ordermatching.market.kafka;

import java.math.BigDecimal;

public class TopOfBookUpdatedEvent {
    private String symbolId;
    private BigDecimal lastPrice;
    private BigDecimal bestBid;
    private BigDecimal bestAsk;
    private BigDecimal change24h;

    public TopOfBookUpdatedEvent() {}

    public TopOfBookUpdatedEvent(String symbolId, BigDecimal lastPrice, BigDecimal bestBid, BigDecimal bestAsk, BigDecimal change24h) {
        this.symbolId = symbolId;
        this.lastPrice = lastPrice;
        this.bestBid = bestBid;
        this.bestAsk = bestAsk;
        this.change24h = change24h;
    }

    public String getSymbolId() { return symbolId; }
    public void setSymbolId(String symbolId) { this.symbolId = symbolId; }
    public BigDecimal getLastPrice() { return lastPrice; }
    public void setLastPrice(BigDecimal lastPrice) { this.lastPrice = lastPrice; }
    public BigDecimal getBestBid() { return bestBid; }
    public void setBestBid(BigDecimal bestBid) { this.bestBid = bestBid; }
    public BigDecimal getBestAsk() { return bestAsk; }
    public void setBestAsk(BigDecimal bestAsk) { this.bestAsk = bestAsk; }
    public BigDecimal getChange24h() { return change24h; }
    public void setChange24h(BigDecimal change24h) { this.change24h = change24h; }
}
