package com.ordermatching.engine.kafka.events;

import java.math.BigDecimal;

public class TradeExecutedEvent {
    private String tradeId;
    private String makerOrderId;
    private String takerOrderId;
    private String makerAccountId;
    private String takerAccountId;
    private String symbolId;
    private String side;   // side of the taker order
    private BigDecimal price;
    private BigDecimal quantity;
    private long timestamp;

    public TradeExecutedEvent() {}

    public TradeExecutedEvent(String tradeId, String makerOrderId, String takerOrderId,
                               String makerAccountId, String takerAccountId, String symbolId,
                               String side, BigDecimal price, BigDecimal quantity, long timestamp) {
        this.tradeId = tradeId;
        this.makerOrderId = makerOrderId;
        this.takerOrderId = takerOrderId;
        this.makerAccountId = makerAccountId;
        this.takerAccountId = takerAccountId;
        this.symbolId = symbolId;
        this.side = side;
        this.price = price;
        this.quantity = quantity;
        this.timestamp = timestamp;
    }

    public String getTradeId() { return tradeId; }
    public void setTradeId(String tradeId) { this.tradeId = tradeId; }
    public String getMakerOrderId() { return makerOrderId; }
    public void setMakerOrderId(String makerOrderId) { this.makerOrderId = makerOrderId; }
    public String getTakerOrderId() { return takerOrderId; }
    public void setTakerOrderId(String takerOrderId) { this.takerOrderId = takerOrderId; }
    public String getMakerAccountId() { return makerAccountId; }
    public void setMakerAccountId(String makerAccountId) { this.makerAccountId = makerAccountId; }
    public String getTakerAccountId() { return takerAccountId; }
    public void setTakerAccountId(String takerAccountId) { this.takerAccountId = takerAccountId; }
    public String getSymbolId() { return symbolId; }
    public void setSymbolId(String symbolId) { this.symbolId = symbolId; }
    public String getSide() { return side; }
    public void setSide(String side) { this.side = side; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public BigDecimal getQuantity() { return quantity; }
    public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }
    public long getTimestamp() { return timestamp; }
    public void setTimestamp(long timestamp) { this.timestamp = timestamp; }
}
