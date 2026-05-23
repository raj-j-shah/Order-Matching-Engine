package com.ordermatching.realtime.kafka.events;

import java.math.BigDecimal;

public class TradeExecutedEvent {
    private String tradeId;
    private String makerOrderId;
    private String takerOrderId;
    private String makerAccountId;
    private String takerAccountId;
    private String symbolId;
    private String side;
    private BigDecimal price;
    private BigDecimal quantity;
    private long timestamp;

    public TradeExecutedEvent() {}

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
