package com.ordermatching.market.repository;

import com.ordermatching.market.domain.Trade;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TradeRepository extends JpaRepository<Trade, UUID> {
    List<Trade> findBySymbolIdOrderByTimestampDesc(String symbolId, Pageable pageable);
}
