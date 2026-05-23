package com.ordermatching.market.repository;

import com.ordermatching.market.domain.Symbol;
import com.ordermatching.market.domain.SymbolStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SymbolRepository extends JpaRepository<Symbol, String> {
    List<Symbol> findByStatus(SymbolStatus status);
}
