package com.ordermatching.engine.domain;

import java.math.BigDecimal;

/**
 * Represents an order resting in the order book.
 * Mutable because remainingQuantity changes as fills occur.
 */
public class RestingOrder {

    private final String orderId;
    private final String accountId;
    private final String side;
    private BigDecimal remainingQuantity;
    private final BigDecimal price;
    private final long timestamp;

    public RestingOrder(String orderId, String accountId, String side,
                        BigDecimal quantity, BigDecimal price, long timestamp) {
        this.orderId = orderId;
        this.accountId = accountId;
        this.side = side;
        this.remainingQuantity = quantity;
        this.price = price;
        this.timestamp = timestamp;
    }

    public String getOrderId() { return orderId; }
    public String getAccountId() { return accountId; }
    public String getSide() { return side; }
    public BigDecimal getRemainingQuantity() { return remainingQuantity; }
    public void setRemainingQuantity(BigDecimal remainingQuantity) { this.remainingQuantity = remainingQuantity; }
    public BigDecimal getPrice() { return price; }
    public long getTimestamp() { return timestamp; }

    public boolean isFullyFilled() {
        return remainingQuantity.compareTo(BigDecimal.ZERO) <= 0;
    }
}
