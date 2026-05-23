package com.ordermatching.account.repository;

import com.ordermatching.account.domain.Account;
import com.ordermatching.account.domain.AccountRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AccountRepository extends JpaRepository<Account, UUID> {
    List<Account> findByRole(AccountRole role);
    boolean existsByName(String name);
}
