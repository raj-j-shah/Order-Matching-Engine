package com.ordermatching.market.grpc;

import com.ordermatching.market.domain.Symbol;
import com.ordermatching.market.domain.SymbolStatus;
import com.ordermatching.market.repository.SymbolRepository;
import com.ordermatching.proto.market.EmptyRequest;
import com.ordermatching.proto.market.GetSymbolRequest;
import com.ordermatching.proto.market.MarketDataServiceGrpc;
import com.ordermatching.proto.market.PriceSnapshot;
import com.ordermatching.proto.market.SymbolListResponse;
import com.ordermatching.proto.market.SymbolResponse;
import com.ordermatching.proto.market.AddSymbolRequest;
import com.ordermatching.proto.market.DeleteSymbolRequest;
import com.ordermatching.proto.market.DeleteSymbolResponse;
import com.ordermatching.proto.market.GetRecentTradesRequest;
import com.ordermatching.proto.market.RecentTrade;
import com.ordermatching.proto.market.RecentTradesResponse;
import com.ordermatching.market.repository.TradeRepository;
import org.springframework.data.domain.PageRequest;
import io.grpc.Status;
import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.devh.boot.grpc.server.service.GrpcService;

@GrpcService
@RequiredArgsConstructor
@Slf4j
public class MarketDataGrpcService extends MarketDataServiceGrpc.MarketDataServiceImplBase {

    private final SymbolRepository symbolRepository;
    private final TradeRepository tradeRepository;

    @Override
    public void getActiveSymbols(EmptyRequest request, StreamObserver<SymbolListResponse> responseObserver) {
        try {
            SymbolListResponse.Builder builder = SymbolListResponse.newBuilder();
            symbolRepository.findByStatus(SymbolStatus.TRADING).stream()
                    .map(this::toProto)
                    .forEach(builder::addSymbols);
            responseObserver.onNext(builder.build());
            responseObserver.onCompleted();
        } catch (Exception e) {
            log.error("Error fetching active symbols", e);
            responseObserver.onError(Status.INTERNAL.withDescription(e.getMessage()).asException());
        }
    }

    @Override
    public void getSymbol(GetSymbolRequest request, StreamObserver<SymbolResponse> responseObserver) {
        try {
            symbolRepository.findById(request.getSymbolId())
                    .map(this::toProto)
                    .ifPresentOrElse(
                            proto -> {
                                responseObserver.onNext(proto);
                                responseObserver.onCompleted();
                            },
                            () -> responseObserver.onError(
                                    Status.NOT_FOUND
                                            .withDescription("Symbol not found: " + request.getSymbolId())
                                            .asException()
                            )
                    );
        } catch (Exception e) {
            log.error("Error fetching symbol {}", request.getSymbolId(), e);
            responseObserver.onError(Status.INTERNAL.withDescription(e.getMessage()).asException());
        }
    }

    @Override
    public void addSymbol(AddSymbolRequest request, StreamObserver<SymbolResponse> responseObserver) {
        try {
            Symbol symbol = symbolRepository.findById(request.getSymbolId()).orElse(null);
            if (symbol != null) {
                if (symbol.getStatus() == SymbolStatus.DELETED) {
                    symbol.setStatus(SymbolStatus.TRADING);
                    symbol.setBaseCurrency(request.getBaseCurrency());
                    symbol.setQuoteCurrency(request.getQuoteCurrency());
                    Symbol saved = symbolRepository.save(symbol);
                    responseObserver.onNext(toProto(saved));
                    responseObserver.onCompleted();
                    return;
                } else {
                    responseObserver.onError(Status.ALREADY_EXISTS.withDescription("Symbol already exists").asException());
                    return;
                }
            }
            symbol = new Symbol();
            symbol.setId(request.getSymbolId());
            symbol.setBaseCurrency(request.getBaseCurrency());
            symbol.setQuoteCurrency(request.getQuoteCurrency());
            symbol.setStatus(SymbolStatus.TRADING);
            Symbol saved = symbolRepository.save(symbol);
            responseObserver.onNext(toProto(saved));
            responseObserver.onCompleted();
        } catch (Exception e) {
            log.error("Error adding symbol {}", request.getSymbolId(), e);
            responseObserver.onError(Status.INTERNAL.withDescription(e.getMessage()).asException());
        }
    }

    @Override
    public void deleteSymbol(DeleteSymbolRequest request, StreamObserver<DeleteSymbolResponse> responseObserver) {
        try {
            boolean exists = symbolRepository.existsById(request.getSymbolId());
            if (exists) {
                Symbol s = symbolRepository.findById(request.getSymbolId()).get();
                s.setStatus(SymbolStatus.DELETED);
                symbolRepository.save(s);
            }
            responseObserver.onNext(DeleteSymbolResponse.newBuilder().setSuccess(exists).build());
            responseObserver.onCompleted();
        } catch (Exception e) {
            log.error("Error deleting symbol {}", request.getSymbolId(), e);
            responseObserver.onError(Status.INTERNAL.withDescription(e.getMessage()).asException());
        }
    }

    @Override
    public void getRecentTrades(GetRecentTradesRequest request, StreamObserver<RecentTradesResponse> responseObserver) {
        try {
            int limit = request.getLimit() > 0 ? request.getLimit() : 50;
            RecentTradesResponse.Builder builder = RecentTradesResponse.newBuilder();
            tradeRepository.findBySymbolIdOrderByTimestampDesc(request.getSymbolId(), PageRequest.of(0, limit))
                    .forEach(t -> {
                        RecentTrade rt = RecentTrade.newBuilder()
                                .setTradeId(t.getTradeId().toString())
                                .setPrice(t.getPrice().toPlainString())
                                .setQuantity(t.getQuantity().toPlainString())
                                .setTimestamp(t.getTimestamp())
                                // We don't have side per-se globally unless we assume maker's side.
                                // The public trades list in many exchanges colors based on whether the taker was buy or sell.
                                // In this DB, we don't have taker side explicitly, so we just use an empty string or derive it.
                                // We can leave it empty and let frontend just show standard.
                                .setSide("") 
                                .build();
                        builder.addTrades(rt);
                    });
            responseObserver.onNext(builder.build());
            responseObserver.onCompleted();
        } catch (Exception e) {
            log.error("Error fetching recent trades for {}", request.getSymbolId(), e);
            responseObserver.onError(Status.INTERNAL.withDescription(e.getMessage()).asException());
        }
    }

    private SymbolResponse toProto(Symbol s) {
        PriceSnapshot snapshot = PriceSnapshot.newBuilder()
                .setLastPrice(s.getLastPrice() != null ? s.getLastPrice().doubleValue() : 0.0)
                .setBestBid(s.getBestBid() != null ? s.getBestBid().doubleValue() : 0.0)
                .setBestAsk(s.getBestAsk() != null ? s.getBestAsk().doubleValue() : 0.0)
                .setChange24H(s.getChange24h() != null ? s.getChange24h().doubleValue() : 0.0)
                .build();

        return SymbolResponse.newBuilder()
                .setSymbolId(s.getId())
                .setBaseCurrency(s.getBaseCurrency())
                .setQuoteCurrency(s.getQuoteCurrency())
                .setStatus(s.getStatus().name())
                .setPriceSnapshot(snapshot)
                .build();
    }
}
