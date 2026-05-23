package com.ordermatching.realtime.dto;

public record TradeNotificationDto(
        String tradeId,
        String symbolId,
        String side,
        String price,
        String quantity,
        String makerAccountId,
        String takerAccountId,
        String makerOrderId,
        String takerOrderId,
        long timestamp
) {}
