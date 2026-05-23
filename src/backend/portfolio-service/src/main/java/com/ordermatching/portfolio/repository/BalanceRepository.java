package com.ordermatching.portfolio.repository;

import com.ordermatching.portfolio.domain.Balance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BalanceRepository extends JpaRepository<Balance, UUID> {
    List<Balance> findByAccountId(UUID accountId);
    Optional<Balance> findByAccountIdAndAsset(UUID accountId, String asset);
}
