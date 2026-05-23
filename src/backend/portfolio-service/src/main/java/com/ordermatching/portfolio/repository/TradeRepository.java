package com.ordermatching.portfolio.repository;

import com.ordermatching.portfolio.domain.Trade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.repository.query.Param;

@Repository
public interface TradeRepository extends JpaRepository<Trade, UUID> {
    @Query("SELECT t FROM Trade t WHERE t.buyerId = :accountId OR t.sellerId = :accountId ORDER BY t.timestamp DESC")
    List<Trade> findByAccountId(@Param("accountId") UUID accountId);
}
