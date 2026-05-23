const fs = require('fs');

let app = fs.readFileSync('src/frontend/src/App.jsx', 'utf-8');

// 1. Add new Proto Imports
const protoImports = `
const CreateAccountRequest = accountPb.CreateAccountRequest;
const DeleteAccountRequest = accountPb.DeleteAccountRequest;
const AddSymbolRequest     = marketPb.AddSymbolRequest;
const DeleteSymbolRequest  = marketPb.DeleteSymbolRequest;
const ModifyBalanceRequest = portfolioPb.ModifyBalanceRequest;
`;
app = app.replace('const MarketEmptyRequest   = marketPb.EmptyRequest;', 'const MarketEmptyRequest   = marketPb.EmptyRequest;\n' + protoImports);

// 2. Add AdminPage component
const adminPageCode = `
// ─── Admin Page ───────────────────────────────────────────────────────────────
function AdminPage({ accounts, symbols, flash, onRefreshAccounts, onRefreshSymbols }) {
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
      if (err) { flash('Error creating trader', false); return; }
      flash('Trader created');
      setNewTraderName('');
      onRefreshAccounts();
    });
  };

  const handleDeleteTrader = (id) => {
    const req = new DeleteAccountRequest();
    req.setAccountId(id);
    accountClient.deleteAccount(req, {}, (err, res) => {
      if (err) { flash('Error deleting trader', false); return; }
      flash('Trader deleted');
      onRefreshAccounts();
    });
  };

  const handleAddSymbol = () => {
    if (!newSymbolBase || !newSymbolQuote) return;
    const req = new AddSymbolRequest();
    req.setSymbolId(newSymbolBase + newSymbolQuote);
    req.setBaseCurrency(newSymbolBase);
    req.setQuoteCurrency(newSymbolQuote);
    marketClient.addSymbol(req, {}, (err, res) => {
      if (err) { flash('Error adding symbol', false); return; }
      flash('Symbol added');
      setNewSymbolBase(''); setNewSymbolQuote('');
      onRefreshSymbols();
    });
  };

  const handleDeleteSymbol = (id) => {
    const req = new DeleteSymbolRequest();
    req.setSymbolId(id);
    marketClient.deleteSymbol(req, {}, (err, res) => {
      if (err) { flash('Error deleting symbol', false); return; }
      flash('Symbol deleted');
      onRefreshSymbols();
    });
  };

  const handleFund = () => {
    if (!fundAccount || !fundAmount) return;
    const req = new ModifyBalanceRequest();
    req.setAccountId(fundAccount);
    req.setAsset(fundAsset);
    req.setAmount(parseFloat(fundAmount));
    portfolioClient.modifyBalance(req, {}, (err, res) => {
      if (err) { flash('Error modifying balance', false); return; }
      flash('Balance modified');
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

// ═══════════════════════════════════════════════════════════════
`;
app = app.replace('// ═══════════════════════════════════════════════════════════════\n// ROOT APP', adminPageCode + '// ROOT APP');

// 3. Fix listAccounts to include roles
app = app.replace(
  'const accs = res.getAccountsList().map(a => ({ id: a.getAccountId(), name: a.getName() }));',
  'const accs = res.getAccountsList().map(a => ({ id: a.getAccountId(), name: a.getName(), role: a.getRole() }));'
);

// 4. Update the App component to handle Admin role
// Replace the return block and NAV_ITEMS inside App()
const oldNavItemsStr = `  const NAV_ITEMS = [
    { id: 'trading',   label: 'Trading',        icon: Icon.chart },
    { id: 'orders',    label: 'My Orders',      icon: Icon.orders, badge: openOrders.length },
    { id: 'history',   label: 'Trade History',  icon: Icon.history },
    { id: 'portfolio', label: 'Portfolio',      icon: Icon.portfolio },
  ];`;

const newNavItemsStr = `  const isAdmin = accounts.find(a => a.id === activeAccount)?.role === 'ADMIN';
  
  const NAV_ITEMS = isAdmin ? [
    { id: 'admin', label: 'Admin Panel', icon: Icon.portfolio }
  ] : [
    { id: 'trading',   label: 'Trading',        icon: Icon.chart },
    { id: 'orders',    label: 'My Orders',      icon: Icon.orders, badge: openOrders.length },
    { id: 'history',   label: 'Trade History',  icon: Icon.history },
    { id: 'portfolio', label: 'Portfolio',      icon: Icon.portfolio },
  ];
  
  useEffect(() => {
    if (isAdmin && page !== 'admin') setPage('admin');
    if (!isAdmin && page === 'admin') setPage('trading');
  }, [isAdmin, activeAccount]);
`;

app = app.replace(oldNavItemsStr, newNavItemsStr);

// Add admin page rendering
app = app.replace(
  `{page === 'portfolio' && <PortfolioPage balances={balances} accounts={accounts} activeAccount={activeAccount} setActiveAccount={setActiveAccount} onRefresh={() => fetchBalances(activeAccount)} />}`,
  `{page === 'portfolio' && <PortfolioPage balances={balances} accounts={accounts} activeAccount={activeAccount} setActiveAccount={setActiveAccount} onRefresh={() => fetchBalances(activeAccount)} />}
        {page === 'admin'     && <AdminPage accounts={accounts} symbols={symbols} flash={flashGlobal} onRefreshAccounts={fetchAccounts} onRefreshSymbols={fetchSymbols} />}`
);

// Extract fetchAccounts to be callable
app = app.replace(
  `  // Bootstrap
  useEffect(() => {
    try {
      accountClient.listAccounts(new AccountEmpty(), {}, (err, res) => {`,
  `  // Bootstrap
  const fetchAccounts = useCallback(() => {
    try {
      accountClient.listAccounts(new AccountEmpty(), {}, (err, res) => {`
);

app = app.replace(
  `      });
    } catch(e) {}`,
  `      });
    } catch(e) {}
  }, []);
  
  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);`
);

// Extract fetchSymbols to be callable
app = app.replace(
  `    try {
      marketClient.getActiveSymbols(new MarketEmptyRequest(), {}, (err, res) => {
        if (!err) setSymbols(res.getSymbolsList().map(s => s.getSymbolId()));
      });
    } catch(e) {}
  }, []);`,
  `  const fetchSymbols = useCallback(() => {
    try {
      marketClient.getActiveSymbols(new MarketEmptyRequest(), {}, (err, res) => {
        if (!err) setSymbols(res.getSymbolsList().map(s => s.getSymbolId()));
      });
    } catch(e) {}
  }, []);

  useEffect(() => { fetchSymbols(); }, [fetchSymbols]);`
);

fs.writeFileSync('src/frontend/src/App.jsx', app);
console.log('App.jsx updated');
