import React, { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTrading } from '../../context/TradingContext';
import { Icon } from '../common/Icons';

export function Layout() {
  const { accounts, activeAccount, setActiveAccount, symbols, activeSymbol, setActiveSymbol, balances, openOrders, tradeHistory, globalMsg, globalOk } = useTrading();
  const location = useLocation();
  const navigate = useNavigate();

  const cashBalance = balances.find(b => b.asset === 'USDT');
  const accountName = accounts.find(a => a.id === activeAccount)?.name || '';
  const isAdmin = accounts.find(a => a.id === activeAccount)?.role === 'ADMIN';

  const currentPath = location.pathname;

  const NAV_ITEMS = isAdmin ? [
    { id: 'admin', path: '/admin', label: 'Admin Panel', icon: Icon.portfolio }
  ] : [
    { id: 'trading',   path: '/',          label: 'Trading',       icon: Icon.chart },
    { id: 'orders',    path: '/orders',    label: 'My Orders',     icon: Icon.orders,    badge: openOrders.filter(o => ['OPEN','NEW','PARTIAL_FILLED'].includes(o.status)).length },
    { id: 'history',   path: '/history',   label: 'Trade History', icon: Icon.history,   badge: tradeHistory.length },
    { id: 'portfolio', path: '/portfolio', label: 'Portfolio',     icon: Icon.portfolio },
  ];

  useEffect(() => {
    if (isAdmin && currentPath !== '/admin') navigate('/admin');
    if (!isAdmin && currentPath === '/admin') navigate('/');
  }, [isAdmin, activeAccount, currentPath, navigate]);

  useEffect(() => {
    let activeLabel = 'Order Matching Engine';
    if (isAdmin && currentPath === '/admin') activeLabel = 'Admin Panel';
    else if (!isAdmin) {
      if (currentPath === '/') activeLabel = 'Trading';
      else if (currentPath === '/orders') activeLabel = 'My Orders';
      else if (currentPath === '/history') activeLabel = 'Trade History';
      else if (currentPath === '/portfolio') activeLabel = 'Portfolio';
    }
    
    document.title = `OME - ${activeLabel}`;
  }, [currentPath, isAdmin]);

  return (
    <div className="app-container">
      {/* ── Navbar ── */}
      <nav className="navbar">
        <div className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
          </svg>
          OME Pro
        </div>

        {/* Page Nav */}
        <div className="nav-tabs">
          {NAV_ITEMS.map(item => (
            <button key={item.id} className={`nav-tab ${currentPath === item.path ? 'active' : ''}`} onClick={() => navigate(item.path)}>
              {item.icon}
              {item.label}
              {item.badge > 0 && <span className="nav-badge">{item.badge}</span>}
            </button>
          ))}
        </div>

        {/* Controls + Cash */}
        <div className="nav-right">
          {currentPath === '/' && (
            <select value={activeSymbol || ''} onChange={e => setActiveSymbol(e.target.value)} className="nav-select">
              {symbols.length === 0 && <option value="">Loading…</option>}
              {symbols.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
          <select value={activeAccount || ''} onChange={e => setActiveAccount(e.target.value)} className="nav-select">
            {accounts.length === 0 && <option value="">Loading…</option>}
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          {cashBalance && (
            <div className="cash-chip">
              <span className="cash-label">USDT</span>
              <span className="cash-value">{parseFloat(cashBalance.available).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          )}
        </div>
      </nav>

      {/* Global flash */}
      {globalMsg && (
        <div className={`global-flash ${globalOk ? 'flash-ok' : 'flash-err'}`}>{globalMsg}</div>
      )}

      {/* ── Page Content ── */}
      <main className="page-content">
        <Outlet />
      </main>
    </div>
  );
}
