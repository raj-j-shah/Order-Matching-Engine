package com.ordermatching.engine.grpc;

import com.ordermatching.engine.domain.OrderBook;
import com.ordermatching.engine.kafka.events.PriceLevel;
import com.ordermatching.engine.service.OrderBookRegistry;
import com.ordermatching.proto.matching.GetOrderBookRequest;
import com.ordermatching.proto.matching.MatchingServiceGrpc;
import com.ordermatching.proto.matching.OrderBookResponse;
import io.grpc.stub.StreamObserver;
import net.devh.boot.grpc.server.service.GrpcService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import java.util.List;

@GrpcService
@RequiredArgsConstructor
@Slf4j
public class MatchingGrpcService extends MatchingServiceGrpc.MatchingServiceImplBase {

    private final OrderBookRegistry registry;

    @Override
    public void getOrderBookSnapshot(GetOrderBookRequest request, StreamObserver<OrderBookResponse> responseObserver) {
        try {
            OrderBook book = registry.getOrCreate(request.getSymbolId());
            
            OrderBookResponse.Builder responseBuilder = OrderBookResponse.newBuilder()
                    .setSymbolId(book.getSymbolId())
                    .setTimestamp(System.currentTimeMillis());

            List<PriceLevel> bids = book.getBidLevels(20);
            for (PriceLevel level : bids) {
                responseBuilder.addBids(com.ordermatching.proto.matching.PriceLevel.newBuilder()
                        .setPrice(level.getPrice().doubleValue())
                        .setQuantity(level.getTotalQuantity().doubleValue())
                        .build());
            }

            List<PriceLevel> asks = book.getAskLevels(20);
            for (PriceLevel level : asks) {
                responseBuilder.addAsks(com.ordermatching.proto.matching.PriceLevel.newBuilder()
                        .setPrice(level.getPrice().doubleValue())
                        .setQuantity(level.getTotalQuantity().doubleValue())
                        .build());
            }

            responseObserver.onNext(responseBuilder.build());
            responseObserver.onCompleted();
        } catch (Exception e) {
            log.error("Error generating order book snapshot for {}", request.getSymbolId(), e);
            responseObserver.onError(io.grpc.Status.INTERNAL.withDescription(e.getMessage()).asException());
        }
    }
}
