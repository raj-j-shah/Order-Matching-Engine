package com.ordermatching.order.kafka.events;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderCancelledByEngineEvent {
    private String orderId;
    private String symbolId;
    private BigDecimal remainingQuantity;
    private String reason;
    private long timestamp;
}
