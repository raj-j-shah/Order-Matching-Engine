package com.ordermatching.order.kafka.events;

import java.math.BigDecimal;

public class ModifyOrderEvent {
    private String orderId;
    private String symbolId;
    private BigDecimal newQuantity;
    private BigDecimal newPrice;
    private long timestamp;

    public ModifyOrderEvent() {}

    public ModifyOrderEvent(String orderId, String symbolId,
                             BigDecimal newQuantity, BigDecimal newPrice, long timestamp) {
        this.orderId = orderId;
        this.symbolId = symbolId;
        this.newQuantity = newQuantity;
        this.newPrice = newPrice;
        this.timestamp = timestamp;
    }

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }
    public String getSymbolId() { return symbolId; }
    public void setSymbolId(String symbolId) { this.symbolId = symbolId; }
    public BigDecimal getNewQuantity() { return newQuantity; }
    public void setNewQuantity(BigDecimal newQuantity) { this.newQuantity = newQuantity; }
    public BigDecimal getNewPrice() { return newPrice; }
    public void setNewPrice(BigDecimal newPrice) { this.newPrice = newPrice; }
    public long getTimestamp() { return timestamp; }
    public void setTimestamp(long timestamp) { this.timestamp = timestamp; }
}
