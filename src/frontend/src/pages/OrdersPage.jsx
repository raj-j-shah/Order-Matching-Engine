import React, { useState, useMemo } from 'react';
import { useTrading } from '../context/TradingContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';
import { ModifyModal } from '../components/modals/ModifyModal';

export function OrdersPage() {
  const { openOrders, tradeHistory, handleCancelOrder, handleModifyOrder } = useTrading();
  
  const [modifyTarget, setModifyTarget] = useState(null);
  
  const today = new Date().toISOString().split('T')[0];
  const [dateFilter, setDateFilter] = useState(today);
  const [sortCol, setSortCol] = useState('time');
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (col) => {
    if (sortCol === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(col);
      setSortAsc(col !== 'time');
    }
  };

  const SortIcon = ({ col }) => {
    if (sortCol !== col) return <span style={{ opacity: 0.3, marginLeft: 4 }}>↕</span>;
    return <span style={{ marginLeft: 4 }}>{sortAsc ? '↑' : '↓'}</span>;
  };

  const filteredAndSortedOrders = useMemo(() => {
    let result = openOrders;
    
    if (dateFilter) {
      const filterStart = new Date(dateFilter).setHours(0, 0, 0, 0);
      const filterEnd = new Date(dateFilter).setHours(23, 59, 59, 999);
      result = result.filter(o => o.createdAt >= filterStart && o.createdAt <= filterEnd);
    }

    result = [...result].sort((a, b) => {
      let valA, valB;
      switch (sortCol) {
        case 'symbol': valA = a.symbolId; valB = b.symbolId; break;
        case 'type': valA = a.orderType; valB = b.orderType; break;
        case 'side': valA = a.side; valB = b.side; break;
        case 'price': valA = a.price || 0; valB = b.price || 0; break;
        case 'quantity': valA = a.quantity; valB = b.quantity; break;
        case 'status': valA = a.status; valB = b.status; break;
        case 'time': default: valA = a.createdAt; valB = b.createdAt; break;
      }
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
    
    return result;
  }, [openOrders, dateFilter, sortCol, sortAsc]);

  const active = filteredAndSortedOrders.filter(o => ['OPEN', 'NEW', 'PARTIAL_FILLED'].includes(o.status));
  const done   = filteredAndSortedOrders.filter(o => ['FILLED', 'CANCELLED'].includes(o.status));

  const [expandedOrders, setExpandedOrders] = useState(new Set());

  const toggleExpand = (orderId) => {
    const next = new Set(expandedOrders);
    if (next.has(orderId)) next.delete(orderId);
    else next.add(orderId);
    setExpandedOrders(next);
  };

  const getFilledQty = (order) => {
    if (order.status === 'NEW' || order.status === 'OPEN') return 0;
    if (order.status === 'FILLED') return order.quantity;
    const trades = tradeHistory.filter(t => t.buyOrderId === order.orderId || t.sellOrderId === order.orderId);
    return trades.reduce((sum, t) => sum + t.quantity, 0);
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
      <div className="page-header" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">My Orders</h1>
          <div className="page-subtitle">{active.length} active · {done.length} completed</div>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <label style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Date:</label>
          <input 
            type="date" 
            value={dateFilter} 
            onChange={(e) => setDateFilter(e.target.value)}
            className="input-field"
            style={{ width: 'auto', padding: '6px 12px' }}
          />
          <button className="action-btn" onClick={() => setDateFilter('')}>Clear Filter</button>
        </div>
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
                    <th>Order ID</th>
                    <th onClick={() => handleSort('symbol')} style={{ cursor: 'pointer' }}>Symbol <SortIcon col="symbol" /></th>
                    <th onClick={() => handleSort('type')} style={{ cursor: 'pointer' }}>Type <SortIcon col="type" /></th>
                    <th onClick={() => handleSort('side')} style={{ cursor: 'pointer' }}>Side <SortIcon col="side" /></th>
                    <th onClick={() => handleSort('price')} style={{ cursor: 'pointer' }}>Price <SortIcon col="price" /></th>
                    <th onClick={() => handleSort('quantity')} style={{ cursor: 'pointer' }}>Qty <SortIcon col="quantity" /></th>
                    <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>Status <SortIcon col="status" /></th>
                    <th onClick={() => handleSort('time')} style={{ cursor: 'pointer' }}>Created <SortIcon col="time" /></th>
                    <th>Actions</th>
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
                        <td>
                          <div>{o.quantity?.toFixed(4)}</div>
                          {['PARTIAL_FILLED', 'CANCELLED'].includes(o.status) && (
                            <div className="muted" style={{ fontSize: '11px', marginTop: '2px', color: 'var(--text-muted)' }}>
                              Rem: {(o.quantity - getFilledQty(o)).toFixed(4)}
                            </div>
                          )}
                        </td>
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
                  <th>Order ID</th>
                  <th onClick={() => handleSort('symbol')} style={{ cursor: 'pointer' }}>Symbol <SortIcon col="symbol" /></th>
                  <th onClick={() => handleSort('type')} style={{ cursor: 'pointer' }}>Type <SortIcon col="type" /></th>
                  <th onClick={() => handleSort('side')} style={{ cursor: 'pointer' }}>Side <SortIcon col="side" /></th>
                  <th onClick={() => handleSort('price')} style={{ cursor: 'pointer' }}>Price <SortIcon col="price" /></th>
                  <th onClick={() => handleSort('quantity')} style={{ cursor: 'pointer' }}>Qty <SortIcon col="quantity" /></th>
                  <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>Status <SortIcon col="status" /></th>
                  <th onClick={() => handleSort('time')} style={{ cursor: 'pointer' }}>Created <SortIcon col="time" /></th>
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
                      <td>
                        <div>{o.quantity?.toFixed(4)}</div>
                        {o.status === 'CANCELLED' && getFilledQty(o) > 0 && (
                          <div className="muted" style={{ fontSize: '11px', marginTop: '2px', color: 'var(--text-muted)' }}>
                            Rem: {(o.quantity - getFilledQty(o)).toFixed(4)}
                          </div>
                        )}
                      </td>
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
