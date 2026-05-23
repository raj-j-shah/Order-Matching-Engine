package com.ordermatching.engine.service;

import com.ordermatching.engine.domain.OrderBook;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class OrderBookRegistry {

    private static final List<String> DEFAULT_SYMBOLS = List.of(
            "BTCUSDT", "ETHUSDT", "AAPL", "TSLA", "SOLUSDT"
    );

    private final ConcurrentHashMap<String, OrderBook> books = new ConcurrentHashMap<>();

    @PostConstruct
    public void init() {
        DEFAULT_SYMBOLS.forEach(symbolId -> {
            books.put(symbolId, new OrderBook(symbolId));
            log.info("Initialized order book for {}", symbolId);
        });
    }

    public OrderBook getOrCreate(String symbolId) {
        return books.computeIfAbsent(symbolId, OrderBook::new);
    }

    public java.util.Collection<OrderBook> getAllBooks() {
        return books.values();
    }
}
