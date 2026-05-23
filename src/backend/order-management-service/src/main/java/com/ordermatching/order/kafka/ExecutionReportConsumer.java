package com.ordermatching.order.kafka;

import com.ordermatching.order.domain.Order;
import com.ordermatching.order.domain.OrderStatus;
import com.ordermatching.order.kafka.events.TradeExecutedEvent;
import com.ordermatching.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class ExecutionReportConsumer {

    private final OrderRepository orderRepository;

    @KafkaListener(topics = "trades.executed", groupId = "order-management-service")
    @Transactional
    public void handleTradeExecution(TradeExecutedEvent event) {
        log.debug("Processing execution report for trade {}", event.getTradeId());
        updateOrderFill(event.getMakerOrderId(), event.getQuantity(), event.getPrice());
        updateOrderFill(event.getTakerOrderId(), event.getQuantity(), event.getPrice());
    }

    private void updateOrderFill(String orderIdStr, java.math.BigDecimal fillQty, java.math.BigDecimal fillPrice) {
        try {
            UUID orderId = UUID.fromString(orderIdStr);
            orderRepository.findById(orderId).ifPresent(order -> {
                java.math.BigDecimal oldFilled = order.getFilledQuantity();
                java.math.BigDecimal newFilled = oldFilled.add(fillQty);
                
                java.math.BigDecimal oldAvg = order.getAveragePrice() != null ? order.getAveragePrice() : java.math.BigDecimal.ZERO;
                java.math.BigDecimal totalValue = oldAvg.multiply(oldFilled).add(fillPrice.multiply(fillQty));
                order.setAveragePrice(totalValue.divide(newFilled, 8, java.math.RoundingMode.HALF_UP));

                order.setFilledQuantity(newFilled);

                if (newFilled.compareTo(order.getQuantity()) >= 0) {
                    order.setStatus(OrderStatus.FILLED);
                } else {
                    order.setStatus(OrderStatus.PARTIAL_FILLED);
                }
                orderRepository.save(order);
                log.info("Order {} updated: filled={} status={}", orderId, newFilled, order.getStatus());
            });
        } catch (IllegalArgumentException e) {
            log.warn("Invalid order ID in execution report: {}", orderIdStr);
        }
    }
}
