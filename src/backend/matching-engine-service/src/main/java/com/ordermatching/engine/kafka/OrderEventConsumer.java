package com.ordermatching.engine.kafka;

import com.ordermatching.engine.domain.OrderBook;
import com.ordermatching.engine.kafka.events.*;
import com.ordermatching.engine.service.OrderBookRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class OrderEventConsumer {

    private static final int ORDER_BOOK_DEPTH = 20;

    private final OrderBookRegistry registry;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @KafkaListener(topics = "orders.validated", groupId = "matching-engine")
    public void handleNewOrder(OrderEvent event) {
        log.debug("Processing new order: {} {} {} @ {}", event.getSide(), event.getQuantity(), event.getSymbolId(), event.getPrice());
        OrderBook book = registry.getOrCreate(event.getSymbolId());

        List<TradeExecutedEvent> trades = book.matchOrder(event);

        // Publish each trade
        trades.forEach(trade -> {
            kafkaTemplate.send("trades.executed", trade.getSymbolId(), trade);
            log.info("Trade executed: {} qty={} price={}", trade.getSymbolId(), trade.getQuantity(), trade.getPrice());
        });

        // Always publish updated order book
        publishOrderBookUpdate(book);
    }

    @KafkaListener(topics = "orders.cancel", groupId = "matching-engine")
    public void handleCancelOrder(CancelOrderEvent event) {
        log.debug("Cancelling order: {} on {}", event.getOrderId(), event.getSymbolId());
        OrderBook book = registry.getOrCreate(event.getSymbolId());
        boolean cancelled = book.cancelOrder(event.getOrderId());

        if (cancelled) {
            publishOrderBookUpdate(book);
            log.info("Order {} cancelled on {}", event.getOrderId(), event.getSymbolId());
        } else {
            log.warn("Order {} not found in book for cancel", event.getOrderId());
        }
    }

    @KafkaListener(topics = "orders.modify", groupId = "matching-engine")
    public void handleModifyOrder(ModifyOrderEvent event) {
        log.debug("Modifying order: {} on {}", event.getOrderId(), event.getSymbolId());
        OrderBook book = registry.getOrCreate(event.getSymbolId());
        // accountId not available in modify event, pass null - registry lookup handles it
        boolean modified = book.modifyOrder(event.getOrderId(), event.getNewQuantity(), event.getNewPrice(), null);

        if (modified) {
            publishOrderBookUpdate(book);
            log.info("Order {} modified on {}", event.getOrderId(), event.getSymbolId());
        } else {
            log.warn("Order {} not found for modification on {}", event.getOrderId(), event.getSymbolId());
        }
    }

    private void publishOrderBookUpdate(OrderBook book) {
        OrderBookUpdatedEvent update = new OrderBookUpdatedEvent(
                book.getSymbolId(),
                book.getBidLevels(ORDER_BOOK_DEPTH),
                book.getAskLevels(ORDER_BOOK_DEPTH),
                System.currentTimeMillis()
        );
        kafkaTemplate.send("orderbook.updated", book.getSymbolId(), update);
    }

    // Periodical broadcasting is removed to optimize traffic and use event-driven updates.
}
