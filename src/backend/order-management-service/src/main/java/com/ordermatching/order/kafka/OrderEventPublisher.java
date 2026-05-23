package com.ordermatching.order.kafka;

import com.ordermatching.order.kafka.events.CancelOrderEvent;
import com.ordermatching.order.kafka.events.ModifyOrderEvent;
import com.ordermatching.order.kafka.events.OrderEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class OrderEventPublisher {

    private static final String TOPIC_NEW_ORDER   = "orders.validated";
    private static final String TOPIC_CANCEL      = "orders.cancel";
    private static final String TOPIC_MODIFY      = "orders.modify";

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishNewOrder(OrderEvent event) {
        log.info("Publishing new order {} to topic {}", event.getOrderId(), TOPIC_NEW_ORDER);
        kafkaTemplate.send(TOPIC_NEW_ORDER, event.getSymbolId(), event);
    }

    public void publishCancelOrder(CancelOrderEvent event) {
        log.info("Publishing cancel for order {} to topic {}", event.getOrderId(), TOPIC_CANCEL);
        kafkaTemplate.send(TOPIC_CANCEL, event.getSymbolId(), event);
    }

    public void publishModifyOrder(ModifyOrderEvent event) {
        log.info("Publishing modify for order {} to topic {}", event.getOrderId(), TOPIC_MODIFY);
        kafkaTemplate.send(TOPIC_MODIFY, event.getSymbolId(), event);
    }
}
