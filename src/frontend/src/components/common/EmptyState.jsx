import React from 'react';

export function EmptyState({ icon, message, sub }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <div className="empty-message">{message}</div>
      {sub && <div className="empty-sub">{sub}</div>}
    </div>
  );
}
