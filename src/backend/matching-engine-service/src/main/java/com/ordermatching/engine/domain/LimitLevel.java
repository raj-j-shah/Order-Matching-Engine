package com.ordermatching.engine.domain;

import java.math.BigDecimal;
import java.util.Iterator;
import java.util.LinkedList;

/**
 * A single price level in the order book.
 * Contains a FIFO queue of resting orders at this price.
 */
public class LimitLevel {

    private final BigDecimal price;
    private final LinkedList<RestingOrder> orders = new LinkedList<>();

    public LimitLevel(BigDecimal price) {
        this.price = price;
    }

    public void addOrder(RestingOrder order) {
        orders.addLast(order);
    }

    /**
     * Removes the resting order with the given orderId.
     * @return true if found and removed, false otherwise.
     */
    public boolean removeOrder(String orderId) {
        Iterator<RestingOrder> it = orders.iterator();
        while (it.hasNext()) {
            RestingOrder o = it.next();
            if (o.getOrderId().equals(orderId)) {
                it.remove();
                return true;
            }
        }
        return false;
    }

    public BigDecimal getTotalQuantity() {
        return orders.stream()
                .map(RestingOrder::getRemainingQuantity)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public BigDecimal getPrice() { return price; }
    public LinkedList<RestingOrder> getOrders() { return orders; }
    public boolean isEmpty() { return orders.isEmpty(); }
    public RestingOrder peek() { return orders.peekFirst(); }
}
