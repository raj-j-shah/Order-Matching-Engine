package com.ordermatching.order.kafka.events;

import java.math.BigDecimal;

public class OrderEvent {
    private String orderId;
    private String accountId;
    private String symbolId;
    private String side;       // BUY or SELL
    private String orderType;  // LIMIT or MARKET
    private BigDecimal quantity;
    private BigDecimal price;  // null for MARKET
    private long timestamp;

    public OrderEvent() {}

    public OrderEvent(String orderId, String accountId, String symbolId,
                      String side, String orderType, BigDecimal quantity,
                      BigDecimal price, long timestamp) {
        this.orderId = orderId;
        this.accountId = accountId;
        this.symbolId = symbolId;
        this.side = side;
        this.orderType = orderType;
        this.quantity = quantity;
        this.price = price;
        this.timestamp = timestamp;
    }

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }
    public String getAccountId() { return accountId; }
    public void setAccountId(String accountId) { this.accountId = accountId; }
    public String getSymbolId() { return symbolId; }
    public void setSymbolId(String symbolId) { this.symbolId = symbolId; }
    public String getSide() { return side; }
    public void setSide(String side) { this.side = side; }
    public String getOrderType() { return orderType; }
    public void setOrderType(String orderType) { this.orderType = orderType; }
    public BigDecimal getQuantity() { return quantity; }
    public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public long getTimestamp() { return timestamp; }
    public void setTimestamp(long timestamp) { this.timestamp = timestamp; }
}
