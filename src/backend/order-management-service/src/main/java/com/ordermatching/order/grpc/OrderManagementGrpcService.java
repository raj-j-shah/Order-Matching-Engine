package com.ordermatching.order.grpc;

import com.ordermatching.order.domain.Order;
import com.ordermatching.order.domain.OrderSide;
import com.ordermatching.order.domain.OrderType;
import com.ordermatching.order.service.OrderService;
import com.ordermatching.proto.order.CancelOrderRequest;
import com.ordermatching.proto.order.CancelOrderResponse;
import com.ordermatching.proto.order.GetOpenOrdersRequest;
import com.ordermatching.proto.order.ModifyOrderRequest;
import com.ordermatching.proto.order.OrderListResponse;
import com.ordermatching.proto.order.OrderManagementServiceGrpc;
import com.ordermatching.proto.order.OrderResponse;
import com.ordermatching.proto.order.PlaceOrderRequest;
import io.grpc.Status;
import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.devh.boot.grpc.server.service.GrpcService;

import java.math.BigDecimal;
import java.util.UUID;

@GrpcService
@RequiredArgsConstructor
@Slf4j
public class OrderManagementGrpcService extends OrderManagementServiceGrpc.OrderManagementServiceImplBase {

    private final OrderService orderService;

    @Override
    public void placeOrder(PlaceOrderRequest request, StreamObserver<OrderResponse> responseObserver) {
        try {
            UUID accountId = UUID.fromString(request.getAccountId());
            OrderSide side = OrderSide.valueOf(request.getSide().toUpperCase());
            OrderType orderType = OrderType.valueOf(request.getOrderType().toUpperCase());
            BigDecimal quantity = BigDecimal.valueOf(request.getQuantity());
            BigDecimal price = request.getPrice() > 0 ? BigDecimal.valueOf(request.getPrice()) : null;

            Order placed = orderService.placeOrder(accountId, request.getSymbolId(), side, orderType, quantity, price);
            responseObserver.onNext(toProto(placed));
            responseObserver.onCompleted();
        } catch (io.grpc.StatusRuntimeException e) {
            responseObserver.onError(e);
        } catch (Exception e) {
            log.error("Error placing order", e);
            responseObserver.onError(Status.INTERNAL.withDescription(e.getMessage()).asException());
        }
    }

    @Override
    public void modifyOrder(ModifyOrderRequest request, StreamObserver<OrderResponse> responseObserver) {
        try {
            UUID orderId = UUID.fromString(request.getOrderId());
            UUID accountId = UUID.fromString(request.getAccountId());
            BigDecimal newQty = BigDecimal.valueOf(request.getNewQuantity());
            BigDecimal newPrice = request.getNewPrice() > 0 ? BigDecimal.valueOf(request.getNewPrice()) : null;

            Order modified = orderService.modifyOrder(orderId, accountId, newQty, newPrice);
            responseObserver.onNext(toProto(modified));
            responseObserver.onCompleted();
        } catch (io.grpc.StatusRuntimeException e) {
            responseObserver.onError(e);
        } catch (Exception e) {
            log.error("Error modifying order", e);
            responseObserver.onError(Status.INTERNAL.withDescription(e.getMessage()).asException());
        }
    }

    @Override
    public void cancelOrder(CancelOrderRequest request, StreamObserver<CancelOrderResponse> responseObserver) {
        try {
            UUID orderId = UUID.fromString(request.getOrderId());
            UUID accountId = UUID.fromString(request.getAccountId());
            orderService.cancelOrder(orderId, accountId);

            responseObserver.onNext(CancelOrderResponse.newBuilder()
                    .setSuccess(true)
                    .setMessage("Order cancelled successfully")
                    .build());
            responseObserver.onCompleted();
        } catch (io.grpc.StatusRuntimeException e) {
            responseObserver.onError(e);
        } catch (Exception e) {
            log.error("Error cancelling order", e);
            responseObserver.onError(Status.INTERNAL.withDescription(e.getMessage()).asException());
        }
    }

    @Override
    public void getOpenOrders(GetOpenOrdersRequest request, StreamObserver<OrderListResponse> responseObserver) {
        try { 
            log.info("getOpenOrders called for account: {}, symbol: {}", request.getAccountId(), request.getSymbolId());
            UUID accountId = UUID.fromString(request.getAccountId());
            String symbolId = request.getSymbolId().isBlank() ? null : request.getSymbolId();

            OrderListResponse.Builder builder = OrderListResponse.newBuilder();
            orderService.getOpenOrders(accountId, symbolId).stream()
                    .map(this::toProto)
                    .forEach(builder::addOrders);

            responseObserver.onNext(builder.build());
            responseObserver.onCompleted();
        } catch (Exception e) {
            log.error("Error fetching open orders", e);
            responseObserver.onError(Status.INTERNAL.withDescription(e.getMessage()).asException());
        }
    }

    private OrderResponse toProto(Order order) {
        OrderResponse.Builder builder = OrderResponse.newBuilder()
                .setOrderId(order.getId().toString())
                .setAccountId(order.getAccountId().toString())
                .setSymbolId(order.getSymbolId())
                .setSide(order.getSide().name())
                .setOrderType(order.getOrderType().name())
                .setQuantity(order.getQuantity().doubleValue())
                .setStatus(order.getStatus().name())
                .setCreatedAt(order.getCreatedAt().toEpochMilli());

        if (order.getPrice() != null) {
            builder.setPrice(order.getPrice().doubleValue());
        }
        if (order.getAveragePrice() != null) {
            builder.setAveragePrice(order.getAveragePrice().doubleValue());
        }
        return builder.build();
    }
}
