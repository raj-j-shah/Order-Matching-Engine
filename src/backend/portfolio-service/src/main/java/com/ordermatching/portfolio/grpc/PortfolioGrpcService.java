package com.ordermatching.portfolio.grpc;

import com.ordermatching.portfolio.domain.Balance;
import com.ordermatching.portfolio.service.PortfolioService;
import com.ordermatching.proto.portfolio.AssetBalance;
import com.ordermatching.proto.portfolio.GetBalancesRequest;
import com.ordermatching.proto.portfolio.BalancesResponse;
import com.ordermatching.proto.portfolio.PortfolioServiceGrpc;
import com.ordermatching.proto.portfolio.ModifyBalanceRequest;
import com.ordermatching.proto.portfolio.ModifyBalanceResponse;
import com.ordermatching.proto.portfolio.GetTradeHistoryRequest;
import com.ordermatching.proto.portfolio.TradeHistoryResponse;
import com.ordermatching.proto.portfolio.TradeRecord;
import com.ordermatching.portfolio.domain.Trade;
import io.grpc.Status;
import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.devh.boot.grpc.server.service.GrpcService;

import java.util.UUID;

@GrpcService
@RequiredArgsConstructor
@Slf4j
public class PortfolioGrpcService extends PortfolioServiceGrpc.PortfolioServiceImplBase {

    private final PortfolioService portfolioService;

    @Override
    public void getBalances(GetBalancesRequest request, StreamObserver<BalancesResponse> responseObserver) {
        try {
            UUID accountId = UUID.fromString(request.getAccountId());
            BalancesResponse.Builder builder = BalancesResponse.newBuilder()
                    .setAccountId(accountId.toString());

            portfolioService.getBalances(accountId).stream()
                    .map(this::toProto)
                    .forEach(builder::addBalances);

            responseObserver.onNext(builder.build());
            responseObserver.onCompleted();
        } catch (Exception e) {
            log.error("Error fetching balances for account {}", request.getAccountId(), e);
            responseObserver.onError(Status.INTERNAL.withDescription(e.getMessage()).asException());
        }
    }

    @Override
    public void modifyBalance(ModifyBalanceRequest request, StreamObserver<ModifyBalanceResponse> responseObserver) {
        try {
            UUID accountId = UUID.fromString(request.getAccountId());
            java.math.BigDecimal amount = java.math.BigDecimal.valueOf(request.getAmount());
            portfolioService.addFunds(accountId, request.getAsset(), amount);
            
            responseObserver.onNext(ModifyBalanceResponse.newBuilder().setSuccess(true).build());
            responseObserver.onCompleted();
        } catch (Exception e) {
            log.error("Error modifying balance for account {}", request.getAccountId(), e);
            responseObserver.onError(Status.INTERNAL.withDescription(e.getMessage()).asException());
        }
    }

    @Override
    public void getTradeHistory(GetTradeHistoryRequest request, StreamObserver<TradeHistoryResponse> responseObserver) {
        try {
            UUID accountId = UUID.fromString(request.getAccountId());
            TradeHistoryResponse.Builder builder = TradeHistoryResponse.newBuilder();

            portfolioService.getTradeHistory(accountId).forEach(t -> {
                boolean isBuyer = t.getBuyerId().equals(accountId);
                String side = isBuyer ? "BUY" : "SELL";
                String orderId = isBuyer ? t.getBuyOrderId().toString() : t.getSellOrderId().toString();
                TradeRecord record = TradeRecord.newBuilder()
                        .setTradeId(t.getTradeId().toString())
                        .setOrderId(orderId)
                        .setSymbolId(t.getSymbolId())
                        .setSide(side)
                        .setPrice(t.getPrice().doubleValue())
                        .setQuantity(t.getQuantity().doubleValue())
                        .setTimestamp(t.getTimestamp())
                        .setBuyerId(t.getBuyerId().toString())
                        .setSellerId(t.getSellerId().toString())
                        .setBuyOrderId(t.getBuyOrderId().toString())
                        .setSellOrderId(t.getSellOrderId().toString())
                        .build();
                builder.addTrades(record);
            });

            responseObserver.onNext(builder.build());
            responseObserver.onCompleted();
        } catch (Exception e) {
            log.error("Error fetching trade history for account {}", request.getAccountId(), e);
            responseObserver.onError(Status.INTERNAL.withDescription(e.getMessage()).asException());
        }
    }

    private AssetBalance toProto(Balance balance) {
        return AssetBalance.newBuilder()
                .setAsset(balance.getAsset())
                .setAvailable(balance.getAvailable().doubleValue())
                .setLocked(balance.getLocked().doubleValue())
                .build();
    }
}
