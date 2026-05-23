import React, { useState } from 'react';
import { useTrading } from '../context/TradingContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';
import { ModifyModal } from '../components/modals/ModifyModal';

export function OrdersPage() {
  const { openOrders, tradeHistory, handleCancelOrder, handleModifyOrder } = useTrading();
  
  const [modifyTarget, setModifyTarget] = useState(null);
  const active = openOrders.filter(o => ['OPEN', 'NEW', 'PARTIAL_FILLED'].includes(o.status));
  const done   = openOrders.filter(o => ['FILLED', 'CANCELLED'].includes(o.status));

  const [expandedOrders, setExpandedOrders] = useState(new Set());

  const toggleExpand = (orderId) => {
    const next = new Set(expandedOrders);
    if (next.has(orderId)) next.delete(orderId);
    else next.add(orderId);
    setExpandedOrders(next);
  };

  const renderExecutions = (orderId) => {
    const trades = tradeHistory.filter(t => t.buyOrderId === orderId || t.sellOrderId === orderId);
    if (!trades.length) {
      return <div className="muted" style={{ padding: '12px 16px', background: 'var(--bg-lighter)' }}>No executions found.</div>;
    }
    return (
      <div style={{ padding: '12px 16px', background: 'var(--bg-lighter)' }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '11px', letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Executions</h4>
        <table className="table" style={{ background: 'transparent', margin: 0 }}>
          <thead>
            <tr>
              <th style={{ background: 'transparent' }}>Trade ID</th>
              <th style={{ background: 'transparent' }}>Price</th>
              <th style={{ background: 'transparent' }}>Qty</th>
              <th style={{ background: 'transparent' }}>Value</th>
              <th style={{ background: 'transparent' }}>Time</th>
            </tr>
          </thead>
          <tbody>
            {trades.map(t => (
              <tr key={t.tradeId} style={{ background: 'transparent' }}>
                <td className="mono muted">{t.tradeId.slice(0, 8)}…</td>
                <td>{t.price.toFixed(2)}</td>
                <td>{t.quantity.toFixed(4)}</td>
                <td>${(t.price * t.quantity).toFixed(2)}</td>
                <td className="muted">{new Date(t.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="full-page">
      <div className="page-header">
        <h1 className="page-title">My Orders</h1>
        <div className="page-subtitle">{active.length} active · {done.length} completed</div>
      </div>

      <div className="page-section-label">Active Orders</div>
      <div className="panel table-panel">
        {active.length === 0
          ? <EmptyState icon="📋" message="No active orders" sub="Place a limit order to see it here" />
          : <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 32 }}></th>
                    <th>Order ID</th><th>Symbol</th><th>Type</th><th>Side</th>
                    <th>Price</th><th>Qty</th><th>Status</th><th>Created</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {active.map(o => (
                    <React.Fragment key={o.orderId}>
                      <tr>
                        <td>
                          <button className="action-btn" style={{ padding: '4px 8px' }} onClick={() => toggleExpand(o.orderId)}>
                            {expandedOrders.has(o.orderId) ? '▼' : '▶'}
                          </button>
                        </td>
                        <td className="mono muted">{o.orderId.slice(0, 8)}…</td>
                        <td>{o.symbolId}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{o.orderType}</td>
                        <td className={o.side === 'BUY' ? 'text-buy' : 'text-sell'}>{o.side}</td>
                        <td>{o.orderType === 'MARKET' ? <span className="muted">Market</span> : o.price?.toFixed(2)}</td>
                        <td>{o.quantity?.toFixed(4)}</td>
                        <td><StatusBadge status={o.status} /></td>
                        <td className="muted">{new Date(o.createdAt).toLocaleString()}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="action-btn modify-btn" onClick={() => setModifyTarget(o)}>Edit</button>
                            <button className="action-btn cancel-btn" onClick={() => handleCancelOrder(o.orderId)}>Cancel</button>
                          </div>
                        </td>
                      </tr>
                      {expandedOrders.has(o.orderId) && (
                        <tr>
                          <td colSpan="10" style={{ padding: 0 }}>
                            {renderExecutions(o.orderId)}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
        }
      </div>

      {done.length > 0 && <>
        <div className="page-section-label" style={{ marginTop: 24 }}>Completed Orders</div>
        <div className="panel table-panel">
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 32 }}></th>
                  <th>Order ID</th><th>Symbol</th><th>Type</th><th>Side</th>
                  <th>Price</th><th>Qty</th><th>Status</th><th>Created</th>
                </tr>
              </thead>
              <tbody>
                {done.map(o => (
                  <React.Fragment key={o.orderId}>
                    <tr style={{ opacity: 0.85 }}>
                      <td>
                        <button className="action-btn" style={{ padding: '4px 8px' }} onClick={() => toggleExpand(o.orderId)}>
                          {expandedOrders.has(o.orderId) ? '▼' : '▶'}
                        </button>
                      </td>
                      <td className="mono muted">{o.orderId.slice(0, 8)}…</td>
                      <td>{o.symbolId}</td>
                      <td className="muted">{o.orderType}</td>
                      <td className={o.side === 'BUY' ? 'text-buy' : 'text-sell'}>{o.side}</td>
                      <td>
                        {o.orderType === 'MARKET'
                          ? (o.averagePrice ? o.averagePrice.toFixed(2) : '0.00')
                          : o.price?.toFixed(2)}
                      </td>
                      <td>{o.quantity?.toFixed(4)}</td>
                      <td><StatusBadge status={o.status} /></td>
                      <td className="muted">{new Date(o.createdAt).toLocaleString()}</td>
                    </tr>
                    {expandedOrders.has(o.orderId) && (
                      <tr>
                        <td colSpan="9" style={{ padding: 0 }}>
                          {renderExecutions(o.orderId)}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>}

      {modifyTarget && (
        <ModifyModal
          order={modifyTarget}
          onClose={() => setModifyTarget(null)}
          onSubmit={(order, price, qty) => { handleModifyOrder(order.orderId, price, qty); setModifyTarget(null); }}
        />
      )}
    </div>
  );
}
