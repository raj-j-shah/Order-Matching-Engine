import React, { useState } from 'react';
import { useTrading } from '../context/TradingContext';
import { accountClient, marketClient, portfolioClient } from '../services/api';
import accountPb from '../proto/account_pb.cjs';
import marketPb from '../proto/market_pb.cjs';
import portfolioPb from '../proto/portfolio_pb.cjs';

const CreateAccountRequest = accountPb.CreateAccountRequest;
const DeleteAccountRequest = accountPb.DeleteAccountRequest;
const AddSymbolRequest     = marketPb.AddSymbolRequest;
const DeleteSymbolRequest  = marketPb.DeleteSymbolRequest;
const ModifyBalanceRequest = portfolioPb.ModifyBalanceRequest;

export function AdminPage() {
  const { accounts, symbols, flashGlobal, fetchAccounts, fetchSymbols } = useTrading();
  
  const [newTraderName, setNewTraderName] = useState('');
  const [newSymbolBase, setNewSymbolBase] = useState('');
  const [newSymbolQuote, setNewSymbolQuote] = useState('');
  
  const [fundAccount, setFundAccount] = useState('');
  const [fundAsset, setFundAsset] = useState('USDT');
  const [fundAmount, setFundAmount] = useState('');

  const handleCreateTrader = () => {
    if (!newTraderName) return;
    const req = new CreateAccountRequest();
    req.setName(newTraderName); req.setRole('TRADER');
    accountClient.createAccount(req, {}, (err, res) => {
      if (err) { flashGlobal('Error creating trader', false); return; }
      flashGlobal('Trader created');
      setNewTraderName('');
      fetchAccounts();
    });
  };

  const handleDeleteTrader = (id) => {
    const req = new DeleteAccountRequest();
    req.setAccountId(id);
    accountClient.deleteAccount(req, {}, (err, res) => {
      if (err) { flashGlobal('Error deleting trader', false); return; }
      flashGlobal('Trader deleted');
      fetchAccounts();
    });
  };

  const handleAddSymbol = () => {
    if (!newSymbolBase || !newSymbolQuote) return;
    const req = new AddSymbolRequest();
    req.setSymbolId(newSymbolBase + newSymbolQuote);
    req.setBaseCurrency(newSymbolBase);
    req.setQuoteCurrency(newSymbolQuote);
    marketClient.addSymbol(req, {}, (err, res) => {
      if (err) { flashGlobal('Error adding symbol', false); return; }
      flashGlobal('Symbol added');
      setNewSymbolBase(''); setNewSymbolQuote('');
      fetchSymbols();
    });
  };

  const handleDeleteSymbol = (id) => {
    const req = new DeleteSymbolRequest();
    req.setSymbolId(id);
    marketClient.deleteSymbol(req, {}, (err, res) => {
      if (err) { flashGlobal('Error deleting symbol', false); return; }
      flashGlobal('Symbol deleted');
      fetchSymbols();
    });
  };

  const handleFund = () => {
    if (!fundAccount || !fundAmount) return;
    const req = new ModifyBalanceRequest();
    req.setAccountId(fundAccount);
    req.setAsset(fundAsset);
    req.setAmount(parseFloat(fundAmount));
    portfolioClient.modifyBalance(req, {}, (err, res) => {
      if (err) { flashGlobal('Error modifying balance', false); return; }
      flashGlobal('Balance modified');
      setFundAmount('');
    });
  };

  return (
    <div className="full-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">System Admin</h1>
          <div className="page-subtitle">Manage traders, symbols, and balances</div>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Traders */}
        <div className="panel">
          <div className="panel-header">Manage Traders</div>
          <div className="panel-content">
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input className="nav-select" style={{ flex: 1 }} placeholder="New Trader Name" value={newTraderName} onChange={e => setNewTraderName(e.target.value)} />
              <button className="action-btn modify-btn" onClick={handleCreateTrader}>Add Trader</button>
            </div>
            <table className="table">
              <thead><tr><th>Name</th><th>Role</th><th>Action</th></tr></thead>
              <tbody>
                {accounts.map(a => (
                  <tr key={a.id}>
                    <td>{a.name}</td><td>{a.role}</td>
                    <td>
                      {a.role !== 'ADMIN' && <button className="action-btn cancel-btn" onClick={() => handleDeleteTrader(a.id)}>Delete</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Symbols */}
        <div className="panel">
          <div className="panel-header">Manage Symbols</div>
          <div className="panel-content">
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input className="nav-select" style={{ width: 80 }} placeholder="Base" value={newSymbolBase} onChange={e => setNewSymbolBase(e.target.value.toUpperCase())} />
              <input className="nav-select" style={{ width: 80 }} placeholder="Quote" value={newSymbolQuote} onChange={e => setNewSymbolQuote(e.target.value.toUpperCase())} />
              <button className="action-btn modify-btn" onClick={handleAddSymbol}>Add Symbol</button>
            </div>
            <table className="table">
              <thead><tr><th>Symbol</th><th>Action</th></tr></thead>
              <tbody>
                {symbols.map(s => (
                  <tr key={s}>
                    <td>{s}</td>
                    <td><button className="action-btn cancel-btn" onClick={() => handleDeleteSymbol(s)}>Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Balances */}
        <div className="panel" style={{ gridColumn: '1 / -1' }}>
          <div className="panel-header">Modify Balances</div>
          <div className="panel-content" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <select className="nav-select" value={fundAccount} onChange={e => setFundAccount(e.target.value)}>
              <option value="">Select Trader...</option>
              {accounts.filter(a => a.role !== 'ADMIN').map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <input className="nav-select" style={{ width: 80 }} placeholder="Asset" value={fundAsset} onChange={e => setFundAsset(e.target.value.toUpperCase())} />
            <input className="nav-select" type="number" placeholder="Amount (+/-)" value={fundAmount} onChange={e => setFundAmount(e.target.value)} />
            <button className="action-btn modify-btn" onClick={handleFund}>Submit Modification</button>
          </div>
        </div>
      </div>
    </div>
  );
}
