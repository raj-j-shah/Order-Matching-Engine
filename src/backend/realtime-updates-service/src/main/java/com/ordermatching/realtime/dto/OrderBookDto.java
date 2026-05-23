package com.ordermatching.realtime.dto;

import java.util.List;

public record OrderBookDto(
        String symbolId,
        List<PriceLevelDto> bids,
        List<PriceLevelDto> asks,
        long timestamp
) {}
