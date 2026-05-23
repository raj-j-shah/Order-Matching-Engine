package com.ordermatching.account.service;

import com.ordermatching.account.domain.Account;
import com.ordermatching.account.domain.AccountRole;
import com.ordermatching.account.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class AccountSeederService {

    private final AccountRepository accountRepository;

    private static final List<String[]> SEED_ACCOUNTS = List.of(
            new String[]{"Alice Trader", "TRADER"},
            new String[]{"Bob Trader", "TRADER"},
            new String[]{"Charlie Trader", "TRADER"},
            new String[]{"Diana Trader", "TRADER"},
            new String[]{"Ethan Trader", "TRADER"},
            new String[]{"System Admin", "ADMIN"}
    );

    @EventListener(ApplicationReadyEvent.class)
    public void seedAccounts() {
        long count = accountRepository.count();
        if (count < 6) {
            log.info("Seeding {} dummy accounts...", SEED_ACCOUNTS.size());
            for (String[] seed : SEED_ACCOUNTS) {
                String name = seed[0];
                AccountRole role = AccountRole.valueOf(seed[1]);
                if (!accountRepository.existsByName(name)) {
                    Account account = new Account(name, role);
                    accountRepository.save(account);
                    log.info("Created account: {} ({})", name, role);
                }
            }
        } else {
            log.info("Accounts already seeded. Skipping.");
        }
    }
}
