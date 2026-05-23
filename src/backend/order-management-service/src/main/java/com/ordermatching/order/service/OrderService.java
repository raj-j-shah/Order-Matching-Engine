package com.ordermatching.order.service;

import com.ordermatching.order.domain.Order;
import com.ordermatching.order.domain.OrderSide;
import com.ordermatching.order.domain.OrderStatus;
import com.ordermatching.order.domain.OrderType;
import com.ordermatching.order.kafka.OrderEventPublisher;
import com.ordermatching.order.kafka.events.CancelOrderEvent;
import com.ordermatching.order.kafka.events.ModifyOrderEvent;
import com.ordermatching.order.kafka.events.OrderEvent;
import com.ordermatching.order.repository.OrderRepository;
import io.grpc.Status;
import io.grpc.StatusRuntimeException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderEventPublisher eventPublisher;

    @Transactional
    public Order placeOrder(UUID accountId, String symbolId, OrderSide side,
                            OrderType orderType, BigDecimal quantity, BigDecimal price) {
        if (quantity == null || quantity.compareTo(BigDecimal.ZERO) <= 0) {
            throw new StatusRuntimeException(Status.INVALID_ARGUMENT.withDescription("Quantity must be positive"));
        }
        if (orderType == OrderType.LIMIT && (price == null || price.compareTo(BigDecimal.ZERO) <= 0)) {
            throw new StatusRuntimeException(Status.INVALID_ARGUMENT.withDescription("Limit order requires a positive price"));
        }

        Order order = new Order(accountId, symbolId, side, orderType, quantity, price);
        Order saved = orderRepository.save(order);
        log.info("Order placed: {} {} {} {} qty={} price={}", saved.getId(), side, orderType, symbolId, quantity, price);

        OrderEvent event = new OrderEvent(
                saved.getId().toString(),
                accountId.toString(),
                symbolId,
                side.name(),
                orderType.name(),
                quantity,
                price,
                System.currentTimeMillis()
        );
        eventPublisher.publishNewOrder(event);
        return saved;
    }

    @Transactional
    public Order modifyOrder(UUID orderId, UUID accountId, BigDecimal newQuantity, BigDecimal newPrice) {
        Order order = findOpenOrderOrThrow(orderId, accountId);

        order.setQuantity(newQuantity);
        if (newPrice != null) order.setPrice(newPrice);
        Order saved = orderRepository.save(order);

        ModifyOrderEvent event = new ModifyOrderEvent(
                orderId.toString(),
                order.getSymbolId(),
                newQuantity,
                newPrice,
                System.currentTimeMillis()
        );
        eventPublisher.publishModifyOrder(event);
        log.info("Order {} modified: qty={} price={}", orderId, newQuantity, newPrice);
        return saved;
    }

    @Transactional
    public void cancelOrder(UUID orderId, UUID accountId) {
        Order order = findOpenOrderOrThrow(orderId, accountId);
        order.setStatus(OrderStatus.CANCELLED);
        orderRepository.save(order);

        CancelOrderEvent event = new CancelOrderEvent(
                orderId.toString(),
                order.getSymbolId(),
                System.currentTimeMillis()
        );
        eventPublisher.publishCancelOrder(event);
        log.info("Order {} cancelled", orderId);
    }

    public List<Order> getOpenOrders(UUID accountId, String symbolId) {
        if (symbolId != null && !symbolId.isBlank()) {
            return orderRepository.findByAccountIdAndSymbolIdAndStatus(accountId, symbolId, OrderStatus.OPEN);
        }
        return orderRepository.findByAccountId(accountId);
    }

    private Order findOpenOrderOrThrow(UUID orderId, UUID accountId) {
        Order order = orderRepository.findById(orderId).orElseThrow(
                () -> new StatusRuntimeException(Status.NOT_FOUND.withDescription("Order not found: " + orderId))
        );
        if (!order.getAccountId().equals(accountId)) {
            throw new StatusRuntimeException(Status.PERMISSION_DENIED.withDescription("Order does not belong to this account"));
        }
        if (order.getStatus() != OrderStatus.OPEN && order.getStatus() != OrderStatus.PARTIAL_FILLED) {
            throw new StatusRuntimeException(Status.FAILED_PRECONDITION.withDescription("Order is not in a modifiable state: " + order.getStatus()));
        }
        return order;
    }
}
