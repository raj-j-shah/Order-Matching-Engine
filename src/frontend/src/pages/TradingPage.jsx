import React, { useState } from 'react';
import { useTrading } from '../context/TradingContext';
import { EmptyState } from '../components/common/EmptyState';

export function TradingPage() {
  const { orderBook, trades, openOrders, activeSymbol, handlePlaceOrder } = useTrading();
  
  const [orderType, setOrderType] = useState('LIMIT');
  const [orderPrice, setOrderPrice] = useState('');
  const [orderQty, setOrderQty]     = useState('');
  const [statusMsg, setStatusMsg]   = useState('');
  const [statusOk, setStatusOk]     = useState(true);

  const flash = (msg, ok = true) => {
    setStatusMsg(msg); setStatusOk(ok);
    setTimeout(() => setStatusMsg(''), 4000);
  };

  const handlePlace = (side) => {
    if (!orderQty) { flash('Enter an amount.', false); return; }
    if (orderType === 'LIMIT' && !orderPrice) { flash('Enter a price for limit orders.', false); return; }
    handlePlaceOrder({ side, orderType, price: parseFloat(orderPrice) || 0, qty: parseFloat(orderQty) }, flash);
    setOrderPrice(''); setOrderQty('');
  };

  let cumulativeAskQty = 0;
  let cumulativeAskVal = 0;
  const asksWithCum = orderBook.asks.map(a => {
    cumulativeAskQty += a.quantity;
    cumulativeAskVal += (a.price * a.quantity);
    return { ...a, cumulativeQty: cumulativeAskQty, cumulativeValue: cumulativeAskVal, avgPrice: cumulativeAskVal / cumulativeAskQty };
  });

  let cumulativeBidQty = 0;
  let cumulativeBidVal = 0;
  const bidsWithCum = orderBook.bids.map(b => {
    cumulativeBidQty += b.quantity;
    cumulativeBidVal += (b.price * b.quantity);
    return { ...b, cumulativeQty: cumulativeBidQty, cumulativeValue: cumulativeBidVal, avgPrice: cumulativeBidVal / cumulativeBidQty };
  });

  let baseAsset = 'BTC';
  let quoteAsset = 'USDT';
  if (activeSymbol) {
    if (activeSymbol.includes('_')) {
      const parts = activeSymbol.split('_');
      baseAsset = parts[0];
      quoteAsset = parts[1];
    } else {
      if (activeSymbol.endsWith('USDT')) {
        baseAsset = activeSymbol.replace('USDT', '');
        quoteAsset = 'USDT';
      } else if (activeSymbol.endsWith('USD')) {
        baseAsset = activeSymbol.replace('USD', '');
        quoteAsset = 'USD';
      } else if (activeSymbol.endsWith('BTC')) {
        baseAsset = activeSymbol.replace('BTC', '');
        quoteAsset = 'BTC';
      } else {
        baseAsset = activeSymbol;
        quoteAsset = '';
      }
    }
  }

  const [tooltipState, setTooltipState] = useState({ visible: false, x: 0, y: 0, avgPrice: 0, sumQty: 0, sumVal: 0, side: null, index: null });

  const handleMouseEnter = (e, row, side, index) => {
    const obPanel = e.currentTarget.closest('.ob-panel');
    const obRect = obPanel ? obPanel.getBoundingClientRect() : e.currentTarget.getBoundingClientRect();
    const rowRect = e.currentTarget.getBoundingClientRect();
    
    setTooltipState({
      visible: true,
      x: obRect.right + 10,
      y: rowRect.top - 20,
      avgPrice: row.avgPrice,
      sumQty: row.cumulativeQty,
      sumVal: row.cumulativeValue,
      side,
      index
    });
  };

  const handleMouseMove = (e) => {};

  const handleMouseLeave = () => {
    setTooltipState(s => ({ ...s, visible: false }));
  };

  const maxAskQty = asksWithCum.length > 0 ? asksWithCum[asksWithCum.length - 1].cumulativeQty : 0.001;
  const maxBidQty = bidsWithCum.length > 0 ? bidsWithCum[bidsWithCum.length - 1].cumulativeQty : 0.001;

  const realTotalAsk = asksWithCum.length > 0 ? maxAskQty : 0;
  const realTotalBid = bidsWithCum.length > 0 ? maxBidQty : 0;
  const totalVolume = realTotalAsk + realTotalBid;
  const bidPercent = totalVolume > 0 ? (realTotalBid / totalVolume) * 100 : 50;
  const askPercent = totalVolume > 0 ? (realTotalAsk / totalVolume) * 100 : 50;

  const myActiveOrders = (openOrders || []).filter(o => 
    o.symbolId === activeSymbol && ['OPEN', 'NEW', 'PARTIAL_FILLED'].includes(o.status)
  );

  const getMyQtyAtPrice = (side, price) => {
    return myActiveOrders
      .filter(o => o.side === side && Math.abs(o.price - price) < 1e-6)
      .reduce((sum, o) => sum + o.quantity, 0);
  };

  return (
    <div className="trading-layout">
      {tooltipState.visible && (
        <div className="ob-tooltip" style={{ position: 'fixed', left: Math.max(10, tooltipState.x), top: tooltipState.y, display: 'grid', zIndex: 9999 }}>
          <span>Avg. Price:</span><span className="val">{tooltipState.avgPrice.toFixed(1)}</span>
          <span>Sum {baseAsset}:</span><span className="val">{tooltipState.sumQty.toFixed(5)}</span>
          <span>Sum {quoteAsset}:</span><span className="val">{tooltipState.sumVal.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits:1})}</span>
        </div>
      )}

      {/* Order Book */}
      <div className="panel ob-panel">
        <div className="panel-header">Order Book</div>
        <div className="panel-content ob-content">
          <div className="ob-row ob-header" style={{ paddingBottom: '8px' }}>
            <div className="ob-col" style={{ textAlign: 'left', paddingLeft: 12 }}>Price ({quoteAsset})</div>
            <div className="ob-col" style={{ textAlign: 'right', paddingRight: 12 }}>Size ({baseAsset})</div>
            <div className="ob-col" style={{ textAlign: 'right', paddingRight: 12 }}>Total ({baseAsset})</div>
          </div>
          <div className="ob-asks">
            {asksWithCum.length === 0
              ? <div className="ob-empty">No asks</div>
              : asksWithCum.map((ask, i) => {
                const isSelected = tooltipState.visible && tooltipState.side === 'ASK' && i <= tooltipState.index;
                const isHoveredEdge = tooltipState.visible && tooltipState.side === 'ASK' && i === tooltipState.index;
                return (
                <div key={i} className={`ob-row ask ${isSelected ? 'selected' : ''} ${isHoveredEdge ? 'hovered-edge' : ''}`} 
                     onClick={() => { setOrderPrice(ask.price.toFixed(2)); setOrderType('LIMIT'); }}
                     onMouseEnter={(e) => handleMouseEnter(e, ask, 'ASK', i)}
                     onMouseMove={handleMouseMove}
                     onMouseLeave={handleMouseLeave}>
                  <div className="depth-bar ask-bar" style={{ width: `${(ask.cumulativeQty / maxAskQty) * 100}%` }}/>
                  <div className="ob-col text-sell" style={{ textAlign: 'left', paddingLeft: 12 }}>
                    {ask.price.toFixed(1)}
                  </div>
                  <div className="ob-col" style={{ textAlign: 'right', paddingRight: 12 }}>{ask.quantity.toFixed(5)}</div>
                  <div className="ob-col" style={{ textAlign: 'right', paddingRight: 12 }}>{ask.cumulativeQty.toFixed(5)}</div>
                </div>
              )})}
          </div>
          <div className="ob-spread" style={{ padding: '8px 12px', border: 'none', justifyContent: 'flex-start' }}>
            {(() => {
              const lastTrade = trades && trades.length > 0 ? trades[0] : null;
              const displayPrice = lastTrade 
                ? lastTrade.price.toFixed(1) 
                : (orderBook.asks.length > 0 && orderBook.bids.length > 0 
                    ? ((orderBook.asks[0].price + orderBook.bids[0].price) / 2).toFixed(1) 
                    : '---');
              const displayColor = lastTrade 
                ? (lastTrade.side === 'BUY' ? 'var(--buy)' : 'var(--sell)') 
                : 'var(--text)';
              return (
                <span className="spread-num" style={{ color: displayColor, fontSize: '20px' }}>
                  {displayPrice}
                </span>
              );
            })()}
          </div>
          <div className="ob-bids">
            {bidsWithCum.length === 0
              ? <div className="ob-empty">No bids</div>
              : bidsWithCum.map((bid, i) => {
                const isSelected = tooltipState.visible && tooltipState.side === 'BID' && i <= tooltipState.index;
                const isHoveredEdge = tooltipState.visible && tooltipState.side === 'BID' && i === tooltipState.index;
                return (
                <div key={i} className={`ob-row bid ${isSelected ? 'selected' : ''} ${isHoveredEdge ? 'hovered-edge' : ''}`} 
                     onClick={() => { setOrderPrice(bid.price.toFixed(2)); setOrderType('LIMIT'); }}
                     onMouseEnter={(e) => handleMouseEnter(e, bid, 'BID', i)}
                     onMouseMove={handleMouseMove}
                     onMouseLeave={handleMouseLeave}>
                  <div className="depth-bar bid-bar" style={{ width: `${(bid.cumulativeQty / maxBidQty) * 100}%` }}/>
                  <div className="ob-col text-buy" style={{ textAlign: 'left', paddingLeft: 12 }}>
                    {bid.price.toFixed(1)}
                  </div>
                  <div className="ob-col" style={{ textAlign: 'right', paddingRight: 12 }}>{bid.quantity.toFixed(5)}</div>
                  <div className="ob-col" style={{ textAlign: 'right', paddingRight: 12 }}>{bid.cumulativeQty.toFixed(5)}</div>
                </div>
              )})}
          </div>
        </div>
        
        {/* Depth Ratio Bar */}
        <div className="ob-ratio-container" style={{ position: 'relative', height: 24, margin: '8px 12px 12px 12px' }}>
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, display: 'flex' }}>
            <div style={{ 
              position: 'absolute', left: 0, top: 0, bottom: 0, width: `calc(${bidPercent}% - 2px)`,
              background: 'rgba(14,203,129,0.15)', color: 'var(--buy)', 
              display: 'flex', alignItems: 'center', paddingLeft: '8px', 
              clipPath: 'polygon(0 0, 100% 0, calc(100% - 8px) 100%, 0 100%)' 
            }}>
              {bidPercent.toFixed(0)}%
            </div>
            <div style={{ 
              position: 'absolute', right: 0, top: 0, bottom: 0, width: `calc(${askPercent}% - 2px)`,
              background: 'rgba(246,70,93,0.15)', color: 'var(--sell)', 
              display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '8px', 
              clipPath: 'polygon(8px 0, 100% 0, 100% 100%, 0 100%)' 
            }}>
              {askPercent.toFixed(0)}%
            </div>
          </div>
        </div>
      </div>

      {/* Market Trades */}
      <div className="panel trades-panel">
        <div className="panel-header">Market Trades</div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {trades.length === 0
            ? <EmptyState icon="📈" message="No trades yet" sub="Place crossing orders to see executions" />
            : <table className="table">
                <thead><tr><th>Price</th><th>Amount</th><th>Time</th></tr></thead>
                <tbody>
                  {trades.map((t, i) => (
                    <tr key={i}>
                      <td className={t.side === 'BUY' ? 'text-buy' : 'text-sell'}>{t.price?.toFixed(2)}</td>
                      <td>{t.quantity?.toFixed(4)}</td>
                      <td style={{ color: '#848e9c' }}>{new Date(t.timestamp).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
          }
        </div>
      </div>

      {/* Order Entry */}
      <div className="panel order-entry-panel">
        <div className="tabs">
          {['LIMIT', 'MARKET'].map(t => (
            <div key={t} className={`tab ${orderType === t ? 'active' : ''}`} onClick={() => setOrderType(t)}>
              {t.charAt(0) + t.slice(1).toLowerCase()}
            </div>
          ))}
        </div>
        <div className="panel-content">
          {statusMsg && (
            <div className={`flash-msg ${statusOk ? 'flash-ok' : 'flash-err'}`}>{statusMsg}</div>
          )}
          {orderType === 'LIMIT' ? (
            <div className="form-group">
              <label className="form-label">Price ({quoteAsset})</label>
              <div className="input-group">
                <input type="number" step="0.01" value={orderPrice} onChange={e => setOrderPrice(e.target.value)} placeholder="0.00"/>
                <span className="input-suffix">{quoteAsset}</span>
              </div>
            </div>
          ) : (
            <div className="form-group">
              <div className="market-note">Executes at best available market price</div>
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Amount</label>
            <div className="input-group">
              <input type="number" step="0.0001" value={orderQty} onChange={e => setOrderQty(e.target.value)} placeholder="0.00"/>
              <span className="input-suffix">{baseAsset}</span>
            </div>
          </div>
          <div className="order-btns">
            <button className="btn btn-buy" onClick={() => handlePlace('BUY')}>Buy / Long</button>
            <button className="btn btn-sell" onClick={() => handlePlace('SELL')}>Sell / Short</button>
          </div>
        </div>
      </div>
    </div>
  );
}
