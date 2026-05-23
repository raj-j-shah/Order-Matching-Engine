package com.ordermatching.realtime.kafka.events;

import java.util.List;

public class OrderBookUpdatedEvent {
    private String symbolId;
    private List<PriceLevel> bids;
    private List<PriceLevel> asks;
    private long timestamp;

    public OrderBookUpdatedEvent() {}

    public String getSymbolId() { return symbolId; }
    public void setSymbolId(String symbolId) { this.symbolId = symbolId; }
    public List<PriceLevel> getBids() { return bids; }
    public void setBids(List<PriceLevel> bids) { this.bids = bids; }
    public List<PriceLevel> getAsks() { return asks; }
    public void setAsks(List<PriceLevel> asks) { this.asks = asks; }
    public long getTimestamp() { return timestamp; }
    public void setTimestamp(long timestamp) { this.timestamp = timestamp; }
}
