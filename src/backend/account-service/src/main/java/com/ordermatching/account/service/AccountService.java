package com.ordermatching.account.service;

import com.ordermatching.account.domain.Account;
import com.ordermatching.account.domain.AccountRole;
import com.ordermatching.account.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository accountRepository;

    public List<Account> listAll() {
        return accountRepository.findAll().stream()
                .filter(a -> a.getStatus() != com.ordermatching.account.domain.AccountStatus.DELETED)
                .toList();
    }

    @Transactional
    public Account create(String name, AccountRole role) {
        Account account = new Account(name, role);
        return accountRepository.save(account);
    }

    public Optional<Account> findById(UUID id) {
        return accountRepository.findById(id);
    }

    @Transactional
    public boolean delete(UUID id) {
        return accountRepository.findById(id).map(account -> {
            account.setStatus(com.ordermatching.account.domain.AccountStatus.DELETED);
            account.setName(account.getName() + "_DELETED_" + UUID.randomUUID().toString().substring(0, 8));
            accountRepository.save(account);
            return true;
        }).orElse(false);
    }
}
