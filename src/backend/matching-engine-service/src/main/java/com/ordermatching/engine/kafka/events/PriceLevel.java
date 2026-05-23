package com.ordermatching.engine.kafka.events;

import java.math.BigDecimal;

public class PriceLevel {
    private BigDecimal price;
    private BigDecimal totalQuantity;

    public PriceLevel() {}
    public PriceLevel(BigDecimal price, BigDecimal totalQuantity) {
        this.price = price;
        this.totalQuantity = totalQuantity;
    }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public BigDecimal getTotalQuantity() { return totalQuantity; }
    public void setTotalQuantity(BigDecimal totalQuantity) { this.totalQuantity = totalQuantity; }
}
