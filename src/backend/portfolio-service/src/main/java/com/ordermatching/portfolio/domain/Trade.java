package com.ordermatching.portfolio.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "trade_history")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Trade {
    @Id
    private UUID tradeId;
    private UUID buyerId;
    private UUID sellerId;
    private UUID buyOrderId;
    private UUID sellOrderId;
    private String symbolId;
    private BigDecimal price;
    private BigDecimal quantity;
    private long timestamp;
}
