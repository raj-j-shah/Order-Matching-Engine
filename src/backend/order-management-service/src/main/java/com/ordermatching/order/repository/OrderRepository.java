package com.ordermatching.order.repository;

import com.ordermatching.order.domain.Order;
import com.ordermatching.order.domain.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID> {

    List<Order> findByAccountIdAndStatus(UUID accountId, OrderStatus status);

    List<Order> findByAccountIdAndSymbolIdAndStatus(UUID accountId, String symbolId, OrderStatus status);

    List<Order> findByAccountId(UUID accountId);
}
