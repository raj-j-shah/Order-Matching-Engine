package com.ordermatching.account.grpc;

import com.ordermatching.account.domain.Account;
import com.ordermatching.account.domain.AccountRole;
import com.ordermatching.account.service.AccountService;
import com.ordermatching.proto.account.AccountListResponse;
import com.ordermatching.proto.account.AccountResponse;
import com.ordermatching.proto.account.AccountServiceGrpc;
import com.ordermatching.proto.account.CreateAccountRequest;
import com.ordermatching.proto.account.GetAccountRequest;
import com.ordermatching.proto.account.DeleteAccountRequest;
import com.ordermatching.proto.account.DeleteAccountResponse;
import com.ordermatching.proto.account.Empty;
import io.grpc.Status;
import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.devh.boot.grpc.server.service.GrpcService;

import java.util.UUID;

@GrpcService
@RequiredArgsConstructor
@Slf4j
public class AccountGrpcService extends AccountServiceGrpc.AccountServiceImplBase {

    private final AccountService accountService;

    @Override
    public void listAccounts(Empty request, StreamObserver<AccountListResponse> responseObserver) {
        try {
            AccountListResponse.Builder responseBuilder = AccountListResponse.newBuilder();
            accountService.listAll().stream()
                    .map(this::toProto)
                    .forEach(responseBuilder::addAccounts);
            responseObserver.onNext(responseBuilder.build());
            responseObserver.onCompleted();
        } catch (Exception e) {
            log.error("Error listing accounts", e);
            responseObserver.onError(Status.INTERNAL.withDescription(e.getMessage()).asException());
        }
    }

    @Override
    public void createAccount(CreateAccountRequest request, StreamObserver<AccountResponse> responseObserver) {
        try {
            AccountRole role = AccountRole.TRADER;
            if (request.getRole() != null && !request.getRole().isBlank()) {
                try {
                    role = AccountRole.valueOf(request.getRole().toUpperCase());
                } catch (IllegalArgumentException ignored) {}
            }
            Account created = accountService.create(request.getName(), role);
            responseObserver.onNext(toProto(created));
            responseObserver.onCompleted();
        } catch (Exception e) {
            log.error("Error creating account", e);
            responseObserver.onError(Status.INTERNAL.withDescription(e.getMessage()).asException());
        }
    }

    @Override
    public void getAccount(GetAccountRequest request, StreamObserver<AccountResponse> responseObserver) {
        try {
            UUID id = UUID.fromString(request.getAccountId());
            accountService.findById(id)
                    .map(this::toProto)
                    .ifPresentOrElse(
                            proto -> {
                                responseObserver.onNext(proto);
                                responseObserver.onCompleted();
                            },
                            () -> responseObserver.onError(
                                    Status.NOT_FOUND.withDescription("Account not found: " + request.getAccountId()).asException()
                            )
                    );
        } catch (Exception e) {
            log.error("Error fetching account {}", request.getAccountId(), e);
            responseObserver.onError(Status.INTERNAL.withDescription(e.getMessage()).asException());
        }
    }

    @Override
    public void deleteAccount(DeleteAccountRequest request, StreamObserver<DeleteAccountResponse> responseObserver) {
        try {
            UUID id = UUID.fromString(request.getAccountId());
            boolean deleted = accountService.delete(id);
            responseObserver.onNext(DeleteAccountResponse.newBuilder().setSuccess(deleted).build());
            responseObserver.onCompleted();
        } catch (Exception e) {
            log.error("Error deleting account {}", request.getAccountId(), e);
            responseObserver.onError(Status.INTERNAL.withDescription(e.getMessage()).asException());
        }
    }

    private AccountResponse toProto(Account account) {
        return AccountResponse.newBuilder()
                .setAccountId(account.getId().toString())
                .setName(account.getName())
                .setRole(account.getRole().name())
                .setStatus(account.getStatus().name())
                .build();
    }
}
