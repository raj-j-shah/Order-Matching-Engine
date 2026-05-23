import React, { useState } from 'react';

export function ModifyModal({ order, onClose, onSubmit }) {
  const [newPrice, setNewPrice] = useState(order.price);
  const [newQty, setNewQty]     = useState(order.quantity);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(order, parseFloat(newPrice), parseFloat(newQty));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 style={{ margin: '0 0 16px', color: 'var(--text)' }}>Modify Order</h3>
        <div style={{ marginBottom: '16px', fontSize: '14px', color: '#848e9c' }}>
          <div>Order ID: {order.orderId.slice(0, 8)}...</div>
          <div>Type: {order.side} {order.orderType}</div>
          <div>Status: {order.status}</div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <div className="input-label">New Price</div>
            <input type="number" step="0.01" value={newPrice} onChange={e => setNewPrice(e.target.value)} disabled={order.orderType !== 'LIMIT'} />
          </div>
          <div className="input-group" style={{ marginTop: '12px' }}>
            <div className="input-label">New Quantity</div>
            <input type="number" step="0.01" value={newQty} onChange={e => setNewQty(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}
