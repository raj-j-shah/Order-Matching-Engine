package com.ordermatching.engine.kafka.events;

public class CancelOrderEvent {
    private String orderId;
    private String symbolId;
    private long timestamp;

    public CancelOrderEvent() {}
    public CancelOrderEvent(String orderId, String symbolId, long timestamp) {
        this.orderId = orderId;
        this.symbolId = symbolId;
        this.timestamp = timestamp;
    }

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }
    public String getSymbolId() { return symbolId; }
    public void setSymbolId(String symbolId) { this.symbolId = symbolId; }
    public long getTimestamp() { return timestamp; }
    public void setTimestamp(long timestamp) { this.timestamp = timestamp; }
}
