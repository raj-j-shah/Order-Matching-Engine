package com.ordermatching.portfolio.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "balances")
@Getter
@Setter
@NoArgsConstructor
public class Balance {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "account_id", nullable = false)
    private UUID accountId;

    @Column(nullable = false)
    private String asset;

    @Column(nullable = false, precision = 20, scale = 8)
    private BigDecimal available = BigDecimal.ZERO;

    @Column(nullable = false, precision = 20, scale = 8)
    private BigDecimal locked = BigDecimal.ZERO;

    @Column(name = "updated_at")
    private Instant updatedAt;

    public Balance(UUID accountId, String asset, BigDecimal available) {
        this.accountId = accountId;
        this.asset = asset;
        this.available = available;
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
    
    @PrePersist
    protected void onCreate() {
        updatedAt = Instant.now();
    }
}
