package com.ordermatching.realtime.service;

import com.ordermatching.realtime.dto.OrderBookDto;
import com.ordermatching.realtime.dto.PriceLevelDto;
import com.ordermatching.realtime.dto.TradeNotificationDto;
import com.ordermatching.realtime.kafka.events.OrderBookUpdatedEvent;
import com.ordermatching.realtime.kafka.events.TradeExecutedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class EventBroadcasterService {

    private final SimpMessagingTemplate messagingTemplate;

    @KafkaListener(topics = "orderbook.updated", groupId = "realtime-updates-service")
    public void broadcastOrderBookUpdate(OrderBookUpdatedEvent event) {
        List<PriceLevelDto> bids = event.getBids().stream()
                .map(pl -> new PriceLevelDto(pl.getPrice().toPlainString(), pl.getTotalQuantity().toPlainString()))
                .collect(Collectors.toList());

        List<PriceLevelDto> asks = event.getAsks().stream()
                .map(pl -> new PriceLevelDto(pl.getPrice().toPlainString(), pl.getTotalQuantity().toPlainString()))
                .collect(Collectors.toList());

        OrderBookDto dto = new OrderBookDto(event.getSymbolId(), bids, asks, event.getTimestamp());

        String destination = "/topic/orderbook/" + event.getSymbolId();
        messagingTemplate.convertAndSend(destination, dto);
    }

    @KafkaListener(topics = "trades.executed", groupId = "realtime-updates-service")
    public void broadcastTradeExecution(TradeExecutedEvent event) {
        TradeNotificationDto dto = new TradeNotificationDto(
                event.getTradeId(),
                event.getSymbolId(),
                event.getSide(),
                event.getPrice().toPlainString(),
                event.getQuantity().toPlainString(),
                event.getMakerAccountId(),
                event.getTakerAccountId(),
                event.getMakerOrderId(),
                event.getTakerOrderId(),
                event.getTimestamp()
        );

        // Public feed
        messagingTemplate.convertAndSend("/topic/trades/" + event.getSymbolId(), dto);

        // Private notification to maker
        messagingTemplate.convertAndSend("/user/" + event.getMakerAccountId() + "/trades", dto);

        // Private notification to taker
        messagingTemplate.convertAndSend("/user/" + event.getTakerAccountId() + "/trades", dto);
    }
}
