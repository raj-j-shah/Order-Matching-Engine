import React from 'react';
import { useTrading } from '../context/TradingContext';
import { EmptyState } from '../components/common/EmptyState';

export function TradeHistoryPage() {
  const { tradeHistory } = useTrading();
  const totalVolume = tradeHistory.reduce((s, t) => s + t.price * t.quantity, 0);

  return (
    <div className="full-page">
      <div className="page-header">
        <h1 className="page-title">Trade History</h1>
        <div className="page-subtitle">
          {tradeHistory.length} trades · Total volume: <span style={{ color: 'var(--text-main)' }}>${totalVolume.toFixed(2)}</span>
        </div>
      </div>

      <div className="panel table-panel">
        {tradeHistory.length === 0
          ? <EmptyState icon="📊" message="No trades recorded yet" sub="Execute a trade by placing a crossing order" />
          : <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Trade ID</th><th>Symbol</th><th>Price</th><th>Quantity</th>
                    <th>Value (USDT)</th><th>Buyer</th><th>Seller</th><th>Buy Order ID</th><th>Sell Order ID</th><th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {tradeHistory.map((t, i) => (
                    <tr key={i}>
                      <td className="mono muted">{(t.tradeId || '').slice(0, 8)}…</td>
                      <td>{t.symbolId}</td>
                      <td className={t.side === 'BUY' ? 'text-buy' : 'text-sell'}>{t.price?.toFixed(2)}</td>
                      <td>{t.quantity?.toFixed(4)}</td>
                      <td style={{ color: 'var(--text-muted)' }}>${(t.price * t.quantity).toFixed(2)}</td>
                      <td><span className="account-tag buyer-tag">{t.buyerName || (t.buyerId || '').slice(0, 8)}</span></td>
                      <td><span className="account-tag seller-tag">{t.sellerName || (t.sellerId || '').slice(0, 8)}</span></td>
                      <td className="mono muted">{(t.buyOrderId || '').slice(0, 8)}…</td>
                      <td className="mono muted">{(t.sellOrderId || '').slice(0, 8)}…</td>
                      <td className="muted">{new Date(t.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        }
      </div>
    </div>
  );
}
