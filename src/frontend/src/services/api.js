// grpc-web generated proto files are CJS (.cjs) — Vite handles them via commonjsOptions
import accountGrpcPb from '../proto/account_grpc_web_pb.cjs';
import marketGrpcPb from '../proto/market_grpc_web_pb.cjs';
import orderGrpcPb from '../proto/order_grpc_web_pb.cjs';
import portfolioGrpcPb from '../proto/portfolio_grpc_web_pb.cjs';
import matchingGrpcPb from '../proto/matching_grpc_web_pb.cjs';

const ENVOY_URL = 'http://localhost:8080';

export const accountClient   = new accountGrpcPb.AccountServiceClient(ENVOY_URL, null, null);
export const marketClient    = new marketGrpcPb.MarketDataServiceClient(ENVOY_URL, null, null);
export const orderClient     = new orderGrpcPb.OrderManagementServiceClient(ENVOY_URL, null, null);
export const portfolioClient = new portfolioGrpcPb.PortfolioServiceClient(ENVOY_URL, null, null);
export const matchingClient  = new matchingGrpcPb.MatchingServiceClient(ENVOY_URL, null, null);
