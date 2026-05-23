import React from 'react';

export function StatusBadge({ status }) {
  const map = { OPEN: 'status-open', PARTIAL_FILLED: 'status-partial', FILLED: 'status-filled', CANCELLED: 'status-canceled', NEW: 'status-open' };
  return <span className={`status-badge ${map[status] || 'status-open'}`}>{status}</span>;
}
