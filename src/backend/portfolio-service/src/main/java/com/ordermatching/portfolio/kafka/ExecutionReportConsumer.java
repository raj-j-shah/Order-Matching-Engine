package com.ordermatching.portfolio.kafka;

import com.ordermatching.portfolio.kafka.events.TradeExecutedEvent;
import com.ordermatching.portfolio.service.PortfolioService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class ExecutionReportConsumer {

    private final PortfolioService portfolioService;

    @KafkaListener(topics = "trades.executed", groupId = "portfolio-service")
    public void handleTradeExecution(TradeExecutedEvent event) {
        log.debug("Processing trade execution for portfolio updates: {}", event.getTradeId());
        
        // Simple symbol parsing: e.g. BTCUSDT -> BTC, USDT
        // Assuming quote asset is last 4 characters for USDT/BUSD etc, or 3 for others.
        // A simple hack for standard pairs:
        String symbol = event.getSymbolId();
        String quoteAsset = symbol.endsWith("USDT") ? "USDT" : symbol.substring(symbol.length() - 3);
        String baseAsset = symbol.substring(0, symbol.length() - quoteAsset.length());

        UUID takerId = UUID.fromString(event.getTakerAccountId());
        UUID makerId = UUID.fromString(event.getMakerAccountId());
        
        UUID buyerId;
        UUID sellerId;

        UUID buyOrderId;
        UUID sellOrderId;

        if ("BUY".equalsIgnoreCase(event.getSide())) {
            buyerId = takerId;
            sellerId = makerId;
            buyOrderId = UUID.fromString(event.getTakerOrderId());
            sellOrderId = UUID.fromString(event.getMakerOrderId());
        } else {
            buyerId = makerId;
            sellerId = takerId;
            buyOrderId = UUID.fromString(event.getMakerOrderId());
            sellOrderId = UUID.fromString(event.getTakerOrderId());
        }

        portfolioService.handleTradeExecution(buyerId, sellerId, baseAsset, quoteAsset, event.getPrice(), event.getQuantity(), 
                UUID.fromString(event.getTradeId()), buyOrderId, sellOrderId, event.getSymbolId(), event.getTimestamp());
    }
}
