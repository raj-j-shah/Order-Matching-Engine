package com.ordermatching.market.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "symbols")
@Getter
@Setter
@NoArgsConstructor
public class Symbol {

    @Id
    private String id;

    @Column(name = "base_currency", nullable = false)
    private String baseCurrency;

    @Column(name = "quote_currency", nullable = false)
    private String quoteCurrency;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SymbolStatus status = SymbolStatus.TRADING;

    @Column(precision = 20, scale = 8)
    private BigDecimal lastPrice = BigDecimal.ZERO;

    @Column(precision = 20, scale = 8)
    private BigDecimal bestBid = BigDecimal.ZERO;

    @Column(precision = 20, scale = 8)
    private BigDecimal bestAsk = BigDecimal.ZERO;

    @Column(name = "change_24h", precision = 20, scale = 8)
    private BigDecimal change24h = BigDecimal.ZERO;

    @Column(updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
    }
}
