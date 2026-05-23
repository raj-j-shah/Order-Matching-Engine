package com.ordermatching.market.kafka;

import com.ordermatching.market.domain.Symbol;
import com.ordermatching.market.repository.SymbolRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class MarketDataEventConsumer {

    private final SymbolRepository symbolRepository;

    @KafkaListener(topics = "market.top-of-book", groupId = "market-data-service")
    @Transactional
    public void consume(TopOfBookUpdatedEvent event) {
        log.debug("Received top-of-book update for {}", event.getSymbolId());
        symbolRepository.findById(event.getSymbolId()).ifPresentOrElse(
                symbol -> {
                    symbol.setLastPrice(event.getLastPrice());
                    symbol.setBestBid(event.getBestBid());
                    symbol.setBestAsk(event.getBestAsk());
                    symbol.setChange24h(event.getChange24h());
                    symbolRepository.save(symbol);
                },
                () -> log.warn("Symbol {} not found, skipping update", event.getSymbolId())
        );
    }
}
