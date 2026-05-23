package com.ordermatching.realtime.kafka.events;

import java.math.BigDecimal;

public class PriceLevel {
    private BigDecimal price;
    private BigDecimal totalQuantity;

    public PriceLevel() {}

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public BigDecimal getTotalQuantity() { return totalQuantity; }
    public void setTotalQuantity(BigDecimal totalQuantity) { this.totalQuantity = totalQuantity; }
}
