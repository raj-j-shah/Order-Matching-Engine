import React from 'react';
import { useTrading } from '../context/TradingContext';
import { EmptyState } from '../components/common/EmptyState';

export function PortfolioPage() {
  const { balances, accounts, activeAccount, setActiveAccount, fetchBalances } = useTrading();
  
  const totalUSDT = balances.find(b => b.asset === 'USDT');
  const assetBalances = balances.filter(b => b.asset !== 'USDT');

  return (
    <div className="full-page">
      <div className="page-header">
        <h1 className="page-title">Portfolio</h1>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <select
            value={activeAccount || ''}
            onChange={e => setActiveAccount(e.target.value)}
            className="page-select"
          >
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <button className="refresh-btn" onClick={() => fetchBalances(activeAccount)}>↻ Refresh</button>
        </div>
      </div>

      <div className="portfolio-summary">
        <div className="summary-card">
          <div className="summary-label">Total Available (USDT)</div>
          <div className="summary-value buy">{totalUSDT ? parseFloat(totalUSDT.available).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Locked in Orders (USDT)</div>
          <div className="summary-value sell">{totalUSDT ? parseFloat(totalUSDT.locked).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Total Assets</div>
          <div className="summary-value">{assetBalances.length}</div>
        </div>
      </div>

      <div className="page-section-label">All Balances</div>
      <div className="panel table-panel">
        {balances.length === 0
          ? <EmptyState icon="💼" message="No balances found" sub="Select an account above" />
          : <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Asset</th><th>Available</th><th>Locked</th><th>Total</th><th>% Available</th>
                  </tr>
                </thead>
                <tbody>
                  {balances.map(b => {
                    const avail = parseFloat(b.available);
                    const locked = parseFloat(b.locked);
                    const total = avail + locked;
                    const pct = total > 0 ? (avail / total * 100) : 100;
                    return (
                      <tr key={b.asset}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="asset-pill">{b.asset.slice(0, 1)}</div>
                            <span style={{ fontWeight: 600 }}>{b.asset}</span>
                          </div>
                        </td>
                        <td className="text-buy">{avail.toFixed(b.asset === 'USDT' ? 2 : 6)}</td>
                        <td className={locked > 0 ? 'text-sell' : 'muted'}>{locked.toFixed(b.asset === 'USDT' ? 2 : 6)}</td>
                        <td style={{ fontWeight: 500 }}>{total.toFixed(b.asset === 'USDT' ? 2 : 6)}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="pct-bar"><div className="pct-fill" style={{ width: `${pct}%` }}/></div>
                            <span className="muted" style={{ fontSize: 12 }}>{pct.toFixed(0)}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
        }
      </div>
    </div>
  );
}
