import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { accountClient, marketClient, orderClient, portfolioClient, matchingClient } from '../services/api';
import orderPb from '../proto/order_pb.cjs';
import marketPb from '../proto/market_pb.cjs';
import portfolioPb from '../proto/portfolio_pb.cjs';
import accountPb from '../proto/account_pb.cjs';
import matchingPb from '../proto/matching_pb.cjs';

const PlaceOrderRequest    = orderPb.PlaceOrderRequest;
const ModifyOrderRequest   = orderPb.ModifyOrderRequest;
const CancelOrderRequest   = orderPb.CancelOrderRequest;
const GetOpenOrdersRequest = orderPb.GetOpenOrdersRequest;
const GetBalancesRequest   = portfolioPb.GetBalancesRequest;
const GetTradeHistoryRequest = portfolioPb.GetTradeHistoryRequest;
const GetOrderBookRequest  = matchingPb.GetOrderBookRequest;
const AccountEmpty         = accountPb.Empty;
const MarketEmptyRequest   = marketPb.EmptyRequest;
const GetRecentTradesRequest = marketPb.GetRecentTradesRequest;

export const TradingContext = createContext();

export function useTrading() {
  return useContext(TradingContext);
}

export function TradingProvider({ children }) {
  const [accounts, setAccounts]         = useState([]);
  const [activeAccount, setActiveAccount] = useState(null);
  const [accountMap, setAccountMap]     = useState({});
  const [symbols, setSymbols]           = useState([]);
  const [activeSymbol, setActiveSymbol] = useState(null);
  const [orderBook, setOrderBook]       = useState({ bids: [], asks: [] });
  const [balances, setBalances]         = useState([]);
  const [trades, setTrades]             = useState([]);
  const [tradeHistory, setTradeHistory] = useState([]);
  const [openOrders, setOpenOrders]     = useState([]);
  const [globalMsg, setGlobalMsg]       = useState('');
  const [globalOk, setGlobalOk]         = useState(true);

  const activeAccountRef = useRef(activeAccount);
  useEffect(() => { activeAccountRef.current = activeAccount; }, [activeAccount]);
  const accountMapRef = useRef(accountMap);
  useEffect(() => { accountMapRef.current = accountMap; }, [accountMap]);

  const flashGlobal = useCallback((msg, ok = true) => {
    setGlobalMsg(msg); setGlobalOk(ok);
    setTimeout(() => setGlobalMsg(''), 4000);
  }, []);

  const fetchBalances = useCallback((accountId) => {
    if (!accountId) return;
    const req = new GetBalancesRequest();
    req.setAccountId(accountId);
    portfolioClient.getBalances(req, {}, (err, res) => {
      if (err) return;
      setBalances(res.getBalancesList().map(b => ({ asset: b.getAsset(), available: b.getAvailable(), locked: b.getLocked() })));
    });
  }, []);

  const fetchTradeHistory = useCallback((accountId) => {
    if (!accountId) return;
    const req = new GetTradeHistoryRequest();
    req.setAccountId(accountId);
    portfolioClient.getTradeHistory(req, {}, (err, res) => {
      if (err) return;
      const map = accountMapRef.current;
      const resolve = id => map[id] || (id ? id.slice(0, 8) + '…' : 'Unknown');
      setTradeHistory(res.getTradesList().map(t => ({
        tradeId: t.getTradeId(), symbolId: t.getSymbolId(),
        side: t.getSide(), price: t.getPrice(), quantity: t.getQuantity(), timestamp: t.getTimestamp(),
        buyerName: resolve(t.getBuyerId()), sellerName: resolve(t.getSellerId()),
        buyOrderId: t.getBuyOrderId(), sellOrderId: t.getSellOrderId()
      })));
    });
  }, []);

  const fetchOpenOrders = useCallback((accountId) => {
    if (!accountId) return;
    const req = new GetOpenOrdersRequest();
    req.setAccountId(accountId);
    req.setSymbolId("");
    orderClient.getOpenOrders(req, {}, (err, res) => {
      if (err) return;
      setOpenOrders(res.getOrdersList().map(o => ({
        orderId: o.getOrderId(), accountId: o.getAccountId(), symbolId: o.getSymbolId(),
        side: o.getSide(), orderType: o.getOrderType(), quantity: o.getQuantity(),
        price: o.getPrice(), averagePrice: o.getAveragePrice(), status: o.getStatus(), createdAt: o.getCreatedAt(),
      })));
    });
  }, []);

  const fetchAccounts = useCallback(() => {
    try {
      accountClient.listAccounts(new AccountEmpty(), {}, (err, res) => {
        if (err) return;
        const accs = res.getAccountsList().map(a => ({ id: a.getAccountId(), name: a.getName(), role: a.getRole() }));
        setAccounts(accs);
        const map = {};
        accs.forEach(a => { map[a.id] = a.name; });
        setAccountMap(map);
        if (!activeAccountRef.current && accs.length > 0) {
          setActiveAccount(accs[0].id);
        }
      });
    } catch(e) {}
  }, []);
  
  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const fetchSymbols = useCallback(() => {
    try {
      marketClient.getActiveSymbols(new MarketEmptyRequest(), {}, (err, res) => {
        if (err) return;
        const syms = res.getSymbolsList().map(s => s.getSymbolId ? s.getSymbolId() : String(s));
        setSymbols(syms);
        setActiveSymbol(prev => {
          if (!prev && syms.length > 0) return syms[0];
          return prev;
        });
      });
    } catch(e) {}
  }, []);

  useEffect(() => { fetchSymbols(); }, [fetchSymbols]);

  useEffect(() => { 
    fetchBalances(activeAccount); 
    fetchOpenOrders(activeAccount);
    fetchTradeHistory(activeAccount);
  }, [activeAccount, activeSymbol, fetchBalances, fetchOpenOrders, fetchTradeHistory]);

  // WebSocket
  useEffect(() => {
    if (!activeSymbol) return;

    const req = new GetOrderBookRequest();
    req.setSymbolId(activeSymbol);
    matchingClient.getOrderBookSnapshot(req, {}, (err, res) => {
      if (err) return;
      setOrderBook({
        bids: res.getBidsList().map(b => ({ price: b.getPrice(), quantity: b.getQuantity() })),
        asks: res.getAsksList().map(a => ({ price: a.getPrice(), quantity: a.getQuantity() }))
      });
    });

    const recentTradesReq = new GetRecentTradesRequest();
    recentTradesReq.setSymbolId(activeSymbol);
    recentTradesReq.setLimit(50);
    marketClient.getRecentTrades(recentTradesReq, {}, (err, res) => {
      if (err) return;
      setTrades(res.getTradesList().map(t => ({
        tradeId: t.getTradeId(),
        price: parseFloat(t.getPrice()),
        quantity: parseFloat(t.getQuantity()),
        timestamp: t.getTimestamp(),
        side: t.getSide()
      })));
    });

    const client = new Client({ webSocketFactory: () => new SockJS('http://localhost:8084/ws'), reconnectDelay: 5000 });
    client.onConnect = () => {
      client.subscribe(`/topic/orderbook/${activeSymbol}`, msg => {
        const ob = JSON.parse(msg.body);
        setOrderBook({
          bids: (ob.bids || []).map(b => ({ price: parseFloat(b.price), quantity: parseFloat(b.quantity) })),
          asks: (ob.asks || []).map(a => ({ price: parseFloat(a.price), quantity: parseFloat(a.quantity) })),
        });
      });
      client.subscribe(`/topic/trades/${activeSymbol}`, msg => {
        const tr = JSON.parse(msg.body);
        const parsed = {
          tradeId: tr.tradeId || '', symbolId: tr.symbolId || activeSymbol,
          side: tr.side || '', price: parseFloat(tr.price), quantity: parseFloat(tr.quantity),
          buyerId: tr.side === 'BUY' ? tr.takerAccountId : tr.makerAccountId,
          sellerId: tr.side === 'BUY' ? tr.makerAccountId : tr.takerAccountId,
          buyOrderId: tr.side === 'BUY' ? tr.takerOrderId : tr.makerOrderId,
          sellOrderId: tr.side === 'BUY' ? tr.makerOrderId : tr.takerOrderId,
          timestamp: tr.timestamp || Date.now(),
        };
        setTrades(prev => [parsed, ...prev].slice(0, 50));
        setTradeHistory(prev => {
          const map = accountMapRef.current;
          const resolve = id => map[id] || (id ? id.slice(0, 8) + '…' : 'Unknown');
          return [{
            ...parsed,
            buyerName: resolve(parsed.buyerId),
            sellerName: resolve(parsed.sellerId),
          }, ...prev].slice(0, 500);
        });
        const acc = activeAccountRef.current;
        setTimeout(() => {
          fetchBalances(acc);
          fetchOpenOrders(acc);
        }, 800);
      });
    };
    client.activate();
    return () => client.deactivate();
  }, [activeSymbol, fetchBalances, fetchOpenOrders]);

  useEffect(() => {
    if (!activeAccount) return;
    const client = new Client({ webSocketFactory: () => new SockJS('http://localhost:8084/ws'), reconnectDelay: 5000 });
    client.onConnect = () => {
      client.subscribe(`/user/${activeAccount}/trades`, () => {
        setTimeout(() => {
          fetchBalances(activeAccount);
          fetchOpenOrders(activeAccount);
        }, 800);
      });
    };
    client.activate();
    return () => client.deactivate();
  }, [activeAccount, activeSymbol, fetchBalances, fetchOpenOrders]);

  const handlePlaceOrder = useCallback(({ side, orderType, price, qty }, flash) => {
    if (!activeAccount || !activeSymbol) { flash('Select account & symbol.', false); return; }
    const req = new PlaceOrderRequest();
    req.setAccountId(activeAccount);
    req.setSymbolId(activeSymbol);
    req.setSide(side);
    req.setOrderType(orderType);
    req.setQuantity(qty);
    req.setPrice(price);
    orderClient.placeOrder(req, {}, (err) => {
      if (err) { flash(err.message || 'Error placing order', false); return; }
      flash('Order Placed Successfully', true);
      fetchBalances(activeAccount);
      fetchOpenOrders(activeAccount);
    });
  }, [activeAccount, activeSymbol, fetchBalances, fetchOpenOrders]);

  const handleCancelOrder = useCallback((orderId) => {
    if (!activeAccount) return;
    const req = new CancelOrderRequest();
    req.setOrderId(orderId);
    req.setAccountId(activeAccount);
    orderClient.cancelOrder(req, {}, (err) => {
      if (err) { flashGlobal(err.message || 'Error canceling order', false); return; }
      flashGlobal('Order Canceled', true);
      setTimeout(() => {
        fetchBalances(activeAccount);
        fetchOpenOrders(activeAccount);
      }, 500);
    });
  }, [activeAccount, fetchBalances, fetchOpenOrders, flashGlobal]);

  const handleModifyOrder = useCallback((orderId, newPrice, newQty) => {
    if (!activeAccount) return;
    const req = new ModifyOrderRequest();
    req.setOrderId(orderId);
    req.setAccountId(activeAccount);
    req.setNewPrice(newPrice);
    req.setNewQuantity(newQty);
    orderClient.modifyOrder(req, {}, (err) => {
      if (err) { flashGlobal(err.message || 'Error modifying order', false); return; }
      flashGlobal('Order Modified', true);
      setTimeout(() => {
        fetchBalances(activeAccount);
        fetchOpenOrders(activeAccount);
      }, 500);
    });
  }, [activeAccount, fetchBalances, fetchOpenOrders, flashGlobal]);

  const contextValue = {
    accounts,
    activeAccount,
    setActiveAccount,
    symbols,
    activeSymbol,
    setActiveSymbol,
    orderBook,
    balances,
    trades,
    tradeHistory,
    openOrders,
    globalMsg,
    globalOk,
    flashGlobal,
    fetchAccounts,
    fetchSymbols,
    fetchBalances,
    handlePlaceOrder,
    handleCancelOrder,
    handleModifyOrder
  };

  return (
    <TradingContext.Provider value={contextValue}>
      {children}
    </TradingContext.Provider>
  );
}
