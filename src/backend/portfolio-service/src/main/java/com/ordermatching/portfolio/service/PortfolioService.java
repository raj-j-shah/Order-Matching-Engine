package com.ordermatching.portfolio.service;

import com.ordermatching.portfolio.domain.Balance;
import com.ordermatching.portfolio.domain.Trade;
import com.ordermatching.portfolio.repository.BalanceRepository;
import com.ordermatching.portfolio.repository.TradeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PortfolioService {

    private final BalanceRepository balanceRepository;
    private final TradeRepository tradeRepository;

    public List<Balance> getBalances(UUID accountId) {
        return balanceRepository.findByAccountId(accountId);
    }

    public List<Trade> getTradeHistory(UUID accountId) {
        return tradeRepository.findByAccountId(accountId);
    }

    @Transactional
    public void addFunds(UUID accountId, String asset, BigDecimal amount) {
        Balance balance = balanceRepository.findByAccountIdAndAsset(accountId, asset)
                .orElse(new Balance(accountId, asset, BigDecimal.ZERO));
        
        balance.setAvailable(balance.getAvailable().add(amount));
        balanceRepository.save(balance);
        log.info("Added {} {} to account {}", amount, asset, accountId);
    }

    @Transactional
    public void handleTradeExecution(UUID buyerId, UUID sellerId, String baseAsset, String quoteAsset, BigDecimal price, BigDecimal quantity,
                                     UUID tradeId, UUID buyOrderId, UUID sellOrderId, String symbolId, long timestamp) {
        BigDecimal quoteAmount = price.multiply(quantity);

        // Update buyer: +base, -quote
        Balance buyerBase = getOrCreateBalance(buyerId, baseAsset);
        buyerBase.setAvailable(buyerBase.getAvailable().add(quantity));
        balanceRepository.save(buyerBase);

        Balance buyerQuote = getOrCreateBalance(buyerId, quoteAsset);
        // Note: In a real system with order pre-validation, the quote amount would be moved from locked to deducted.
        // For simplicity here, we just deduct from available.
        buyerQuote.setAvailable(buyerQuote.getAvailable().subtract(quoteAmount));
        balanceRepository.save(buyerQuote);

        // Update seller: -base, +quote
        Balance sellerBase = getOrCreateBalance(sellerId, baseAsset);
        sellerBase.setAvailable(sellerBase.getAvailable().subtract(quantity));
        balanceRepository.save(sellerBase);

        Balance sellerQuote = getOrCreateBalance(sellerId, quoteAsset);
        sellerQuote.setAvailable(sellerQuote.getAvailable().add(quoteAmount));
        balanceRepository.save(sellerQuote);

        Trade trade = Trade.builder()
                .tradeId(tradeId)
                .buyerId(buyerId)
                .sellerId(sellerId)
                .buyOrderId(buyOrderId)
                .sellOrderId(sellOrderId)
                .symbolId(symbolId)
                .price(price)
                .quantity(quantity)
                .timestamp(timestamp)
                .build();
        tradeRepository.save(trade);
        
        log.info("Processed trade balances and saved trade {}. Base: {}, Quote: {}, Qty: {}, Price: {}", tradeId, baseAsset, quoteAsset, quantity, price);
    }

    private Balance getOrCreateBalance(UUID accountId, String asset) {
        return balanceRepository.findByAccountIdAndAsset(accountId, asset)
                .orElse(new Balance(accountId, asset, BigDecimal.ZERO));
    }
}
