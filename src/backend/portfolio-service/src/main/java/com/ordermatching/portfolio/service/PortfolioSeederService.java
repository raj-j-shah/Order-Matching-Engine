package com.ordermatching.portfolio.service;

import com.ordermatching.portfolio.domain.Balance;
import com.ordermatching.portfolio.repository.BalanceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class PortfolioSeederService {

    private final BalanceRepository balanceRepository;
    private final PortfolioService portfolioService;

    // Hardcode known UUIDs for seed accounts to make initial testing easier
    // Or we could fetch from AccountService via gRPC, but for simplicity here we assume the DB is pre-seeded with these IDs or we just wait for trades.
    // Instead of hardcoded UUIDs, a better approach for microservices is listening to "AccountCreated" Kafka events.
    // Since we don't have that yet, let's just create a generic initialization method that could be triggered manually.
    
    @EventListener(ApplicationReadyEvent.class)
    public void onReady() {
        log.info("Portfolio Service is ready. Awaiting trade executions to update balances.");
    }
}
