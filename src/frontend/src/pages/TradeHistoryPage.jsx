import React, { useState, useMemo } from 'react';
import { useTrading } from '../context/TradingContext';
import { EmptyState } from '../components/common/EmptyState';

export function TradeHistoryPage() {
  const { tradeHistory } = useTrading();
  
  const today = new Date().toISOString().split('T')[0];
  const [dateFilter, setDateFilter] = useState(today);
  const [sortCol, setSortCol] = useState('time');
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (col) => {
    if (sortCol === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(col);
      setSortAsc(col !== 'time'); // Default desc for time, asc for others
    }
  };

  const SortIcon = ({ col }) => {
    if (sortCol !== col) return <span style={{ opacity: 0.3, marginLeft: 4 }}>↕</span>;
    return <span style={{ marginLeft: 4 }}>{sortAsc ? '↑' : '↓'}</span>;
  };

  const filteredAndSortedTrades = useMemo(() => {
    let result = tradeHistory;
    
    // Date filter
    if (dateFilter) {
      const filterStart = new Date(dateFilter).setHours(0, 0, 0, 0);
      const filterEnd = new Date(dateFilter).setHours(23, 59, 59, 999);
      result = result.filter(t => t.timestamp >= filterStart && t.timestamp <= filterEnd);
    }

    // Sort
    result = [...result].sort((a, b) => {
      let valA, valB;
      switch (sortCol) {
        case 'symbol': valA = a.symbolId; valB = b.symbolId; break;
        case 'price': valA = a.price; valB = b.price; break;
        case 'quantity': valA = a.quantity; valB = b.quantity; break;
        case 'value': valA = a.price * a.quantity; valB = b.price * b.quantity; break;
        case 'time': default: valA = a.timestamp; valB = b.timestamp; break;
      }
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
    
    return result;
  }, [tradeHistory, dateFilter, sortCol, sortAsc]);

  const totalVolume = filteredAndSortedTrades.reduce((s, t) => s + t.price * t.quantity, 0);

  return (
    <div className="full-page">
      <div className="page-header">
        <h1 className="page-title">Trade History</h1>
        <div className="page-subtitle">
          {tradeHistory.length} trades · Total volume: <span style={{ color: 'var(--text-main)' }}>${totalVolume.toFixed(2)}</span>
        </div>
      </div>

      <div className="panel table-panel">
        <div style={{ padding: '16px', display: 'flex', gap: '16px', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
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
        {filteredAndSortedTrades.length === 0
          ? <EmptyState icon="📊" message="No trades found" sub="Adjust your filters or execute a trade" />
          : <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Trade ID</th>
                    <th onClick={() => handleSort('symbol')} style={{ cursor: 'pointer' }}>Symbol <SortIcon col="symbol" /></th>
                    <th onClick={() => handleSort('price')} style={{ cursor: 'pointer' }}>Price <SortIcon col="price" /></th>
                    <th onClick={() => handleSort('quantity')} style={{ cursor: 'pointer' }}>Quantity <SortIcon col="quantity" /></th>
                    <th onClick={() => handleSort('value')} style={{ cursor: 'pointer' }}>Value (USDT) <SortIcon col="value" /></th>
                    <th>Buyer</th>
                    <th>Seller</th>
                    <th>Buy Order ID</th>
                    <th>Sell Order ID</th>
                    <th onClick={() => handleSort('time')} style={{ cursor: 'pointer' }}>Time <SortIcon col="time" /></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedTrades.map((t, i) => (
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
