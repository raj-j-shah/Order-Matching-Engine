package com.ordermatching.engine.domain;

import com.ordermatching.engine.kafka.events.OrderBookUpdatedEvent;
import com.ordermatching.engine.kafka.events.OrderEvent;
import com.ordermatching.engine.kafka.events.PriceLevel;
import com.ordermatching.engine.kafka.events.TradeExecutedEvent;

import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * In-memory order book for a single trading symbol.
 * Thread safety note: This implementation relies on external synchronization
 * provided by the single-threaded Kafka consumer for this symbol.
 */
public class OrderBook {

    private static final Logger log = LoggerFactory.getLogger(OrderBook.class);

    private final String symbolId;

    // Bids: highest price first (reverse order)
    private final TreeMap<BigDecimal, LimitLevel> bids = new TreeMap<>(Collections.reverseOrder());

    // Asks: lowest price first (natural order)
    private final TreeMap<BigDecimal, LimitLevel> asks = new TreeMap<>();

    // Fast lookup: orderId -> [side ("BUY"/"SELL"), price]
    private final ConcurrentHashMap<String, Object[]> orderIndex = new ConcurrentHashMap<>();

    public OrderBook(String symbolId) {
        this.symbolId = symbolId;
    }

    // ─────────────────────────────────────────
    // PUBLIC API
    // ─────────────────────────────────────────

    /**
     * Matches an incoming order and returns all trades produced.
     * Any unmatched remainder is placed in the book (for LIMIT orders),
     * UNLESS it would cross the same account's own resting orders — in that
     * case the taker is rejected (self-trade prevention, cancel-taker strategy).
     */
    public List<TradeExecutedEvent> matchOrder(OrderEvent event) {
        List<TradeExecutedEvent> trades = new ArrayList<>();
        BigDecimal remainingQty = event.getQuantity();

        if ("BUY".equalsIgnoreCase(event.getSide())) {
            remainingQty = matchAgainstAsks(event, remainingQty, trades);
        } else {
            remainingQty = matchAgainstBids(event, remainingQty, trades);
        }

        // If LIMIT order still has remaining quantity, add it to book —
        // but only if it does NOT cross any of the same account's own resting orders.
        if ("LIMIT".equalsIgnoreCase(event.getOrderType()) && remainingQty.compareTo(BigDecimal.ZERO) > 0) {
            if (wouldSelfCross(event.getAccountId(), event.getSide(), event.getPrice())) {
                log.warn("STP cancel-taker: order {} from account {} would self-cross at price {} — taker rejected, maker stays.",
                        event.getOrderId(), event.getAccountId(), event.getPrice());
                // Do NOT add to book — taker is cancelled.
            } else {
                RestingOrder resting = new RestingOrder(
                        event.getOrderId(),
                        event.getAccountId(),
                        event.getSide().toUpperCase(),
                        remainingQty,
                        event.getPrice(),
                        event.getTimestamp()
                );
                addToBook(resting);
            }
        }

        return trades;
    }

    /**
     * Returns true if placing a new order at {@code price} on {@code side}
     * from {@code accountId} would cross that same account's own resting orders
     * on the opposite side.
     */
    private boolean wouldSelfCross(String accountId, String side, BigDecimal price) {
        if (accountId == null || price == null) return false;
        if ("BUY".equalsIgnoreCase(side)) {
            // Would cross if the account has a resting SELL at price <= our BUY price
            for (Map.Entry<BigDecimal, LimitLevel> entry : asks.entrySet()) {
                if (entry.getKey().compareTo(price) > 0) break; // asks are sorted ascending
                for (RestingOrder o : entry.getValue().getOrders()) {
                    if (accountId.equals(o.getAccountId())) return true;
                }
            }
        } else {
            // Would cross if the account has a resting BUY at price >= our SELL price
            for (Map.Entry<BigDecimal, LimitLevel> entry : bids.entrySet()) {
                if (entry.getKey().compareTo(price) < 0) break; // bids are sorted descending
                for (RestingOrder o : entry.getValue().getOrders()) {
                    if (accountId.equals(o.getAccountId())) return true;
                }
            }
        }
        return false;
    }

    /**
     * Cancels a resting order. Returns true if found and removed.
     */
    public boolean cancelOrder(String orderId) {
        Object[] meta = orderIndex.get(orderId);
        if (meta == null) return false;

        String side = (String) meta[0];
        BigDecimal price = (BigDecimal) meta[1];

        TreeMap<BigDecimal, LimitLevel> book = "BUY".equals(side) ? bids : asks;
        LimitLevel level = book.get(price);
        if (level != null) {
            level.removeOrder(orderId);
            if (level.isEmpty()) book.remove(price);
        }
        orderIndex.remove(orderId);
        return true;
    }

    /**
     * Modifies a resting order. Price change resets time priority.
     * Returns true if found and modified.
     */
    public boolean modifyOrder(String orderId, BigDecimal newQuantity, BigDecimal newPrice, String accountId) {
        Object[] meta = orderIndex.get(orderId);
        if (meta == null) return false;

        String side = (String) meta[0];
        BigDecimal oldPrice = (BigDecimal) meta[1];

        // Remove old entry
        TreeMap<BigDecimal, LimitLevel> book = "BUY".equals(side) ? bids : asks;
        LimitLevel level = book.get(oldPrice);
        if (level != null) {
            level.removeOrder(orderId);
            if (level.isEmpty()) book.remove(oldPrice);
        }
        orderIndex.remove(orderId);

        // Re-add with new parameters and fresh timestamp (loses time priority)
        RestingOrder updated = new RestingOrder(
                orderId, accountId, side,
                newQuantity,
                newPrice != null ? newPrice : oldPrice,
                System.currentTimeMillis()
        );
        addToBook(updated);
        return true;
    }

    /**
     * Returns the top N bid price levels for broadcasting.
     */
    public List<PriceLevel> getBidLevels(int depth) {
        return bids.entrySet().stream()
                .limit(depth)
                .map(e -> new PriceLevel(e.getKey(), e.getValue().getTotalQuantity()))
                .collect(Collectors.toList());
    }

    /**
     * Returns the top N ask price levels for broadcasting.
     */
    public List<PriceLevel> getAskLevels(int depth) {
        return asks.entrySet().stream()
                .limit(depth)
                .map(e -> new PriceLevel(e.getKey(), e.getValue().getTotalQuantity()))
                .collect(Collectors.toList());
    }

    public String getSymbolId() { return symbolId; }

    // ─────────────────────────────────────────
    // PRIVATE MATCHING LOGIC
    // ─────────────────────────────────────────

    private BigDecimal matchAgainstAsks(OrderEvent event, BigDecimal remainingQty,
                                         List<TradeExecutedEvent> trades) {
        Iterator<Map.Entry<BigDecimal, LimitLevel>> it = asks.entrySet().iterator();
        while (it.hasNext() && remainingQty.compareTo(BigDecimal.ZERO) > 0) {
            Map.Entry<BigDecimal, LimitLevel> entry = it.next();
            BigDecimal askPrice = entry.getKey();

            // For LIMIT BUY: only match if ask price <= our limit price
            if ("LIMIT".equalsIgnoreCase(event.getOrderType())
                    && event.getPrice() != null
                    && askPrice.compareTo(event.getPrice()) > 0) {
                break;
            }

            LimitLevel level = entry.getValue();
            remainingQty = fillFromLevel(event, level, askPrice, remainingQty, trades);

            if (level.isEmpty()) it.remove();
        }
        return remainingQty;
    }

    private BigDecimal matchAgainstBids(OrderEvent event, BigDecimal remainingQty,
                                         List<TradeExecutedEvent> trades) {
        Iterator<Map.Entry<BigDecimal, LimitLevel>> it = bids.entrySet().iterator();
        while (it.hasNext() && remainingQty.compareTo(BigDecimal.ZERO) > 0) {
            Map.Entry<BigDecimal, LimitLevel> entry = it.next();
            BigDecimal bidPrice = entry.getKey();

            // For LIMIT SELL: only match if bid price >= our limit price
            if ("LIMIT".equalsIgnoreCase(event.getOrderType())
                    && event.getPrice() != null
                    && bidPrice.compareTo(event.getPrice()) < 0) {
                break;
            }

            LimitLevel level = entry.getValue();
            remainingQty = fillFromLevel(event, level, bidPrice, remainingQty, trades);

            if (level.isEmpty()) it.remove();
        }
        return remainingQty;
    }

    private BigDecimal fillFromLevel(OrderEvent takerEvent, LimitLevel level,
                                      BigDecimal fillPrice, BigDecimal remainingQty,
                                      List<TradeExecutedEvent> trades) {
        Iterator<RestingOrder> orderIt = level.getOrders().iterator();
        while (orderIt.hasNext() && remainingQty.compareTo(BigDecimal.ZERO) > 0) {
            RestingOrder maker = orderIt.next();

            // ── Self-trade prevention ──────────────────────────────────────
            // Skip maker orders that belong to the same account as the taker.
            // The resting order stays on the book; we simply look past it.
            if (maker.getAccountId() != null
                    && maker.getAccountId().equals(takerEvent.getAccountId())) {
                log.warn("Self-trade prevented: account {} tried to match its own order {} against {}",
                        takerEvent.getAccountId(), maker.getOrderId(), takerEvent.getOrderId());
                continue;
            }

            BigDecimal fillQty = remainingQty.min(maker.getRemainingQuantity());

            // Create trade
            TradeExecutedEvent trade = new TradeExecutedEvent(
                    UUID.randomUUID().toString(),
                    maker.getOrderId(),
                    takerEvent.getOrderId(),
                    maker.getAccountId(),
                    takerEvent.getAccountId(),
                    takerEvent.getSymbolId(),
                    takerEvent.getSide().toUpperCase(),
                    fillPrice,
                    fillQty,
                    System.currentTimeMillis()
            );
            trades.add(trade);

            // Update quantities
            maker.setRemainingQuantity(maker.getRemainingQuantity().subtract(fillQty));
            remainingQty = remainingQty.subtract(fillQty);

            if (maker.isFullyFilled()) {
                orderIt.remove();
                orderIndex.remove(maker.getOrderId());
            }
        }
        return remainingQty;
    }

    private void addToBook(RestingOrder order) {
        TreeMap<BigDecimal, LimitLevel> book = "BUY".equals(order.getSide()) ? bids : asks;
        LimitLevel level = book.computeIfAbsent(order.getPrice(), LimitLevel::new);
        level.addOrder(order);
        orderIndex.put(order.getOrderId(), new Object[]{order.getSide(), order.getPrice()});
    }
}
