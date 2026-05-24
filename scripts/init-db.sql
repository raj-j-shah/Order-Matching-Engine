-- =========================================
-- Order Matching Engine - Database Init SQL
-- =========================================

-- Accounts Table
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    role VARCHAR(20) NOT NULL DEFAULT 'TRADER',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Symbols Table
CREATE TABLE IF NOT EXISTS symbols (
    id VARCHAR(20) PRIMARY KEY,
    base_currency VARCHAR(10) NOT NULL,
    quote_currency VARCHAR(10) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'TRADING',
    last_price DECIMAL(20, 8) DEFAULT 0,
    best_bid DECIMAL(20, 8) DEFAULT 0,
    best_ask DECIMAL(20, 8) DEFAULT 0,
    change_24h DECIMAL(20, 8) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id),
    symbol_id VARCHAR(20) NOT NULL REFERENCES symbols(id),
    side VARCHAR(10) NOT NULL,
    order_type VARCHAR(10) NOT NULL,
    quantity DECIMAL(20, 8) NOT NULL,
    price DECIMAL(20, 8),
    average_price DECIMAL(20, 8),
    filled_quantity DECIMAL(20, 8) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version BIGINT DEFAULT 0
);

-- Balances Table
CREATE TABLE IF NOT EXISTS balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id),
    asset VARCHAR(20) NOT NULL,
    available DECIMAL(20, 8) NOT NULL DEFAULT 0,
    locked DECIMAL(20, 8) NOT NULL DEFAULT 0,
    UNIQUE (account_id, asset)
);

-- Trades Table
CREATE TABLE IF NOT EXISTS trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id),
    account_id UUID NOT NULL REFERENCES accounts(id),
    symbol_id VARCHAR(20) NOT NULL REFERENCES symbols(id),
    side VARCHAR(10) NOT NULL,
    price DECIMAL(20, 8) NOT NULL,
    quantity DECIMAL(20, 8) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_account_id ON orders(account_id);
CREATE INDEX IF NOT EXISTS idx_orders_symbol_id ON orders(symbol_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_trades_account_id ON trades(account_id);
CREATE INDEX IF NOT EXISTS idx_trades_symbol_id ON trades(symbol_id);
CREATE INDEX IF NOT EXISTS idx_balances_account_id ON balances(account_id);

-- ─────────────────────────────────────────
-- SEED DATA
-- ─────────────────────────────────────────

-- Dummy Accounts (5 Traders + 1 Admin)
INSERT INTO accounts (id, name, role) VALUES
    ('a1000000-0000-0000-0000-000000000001', 'Alice Trader', 'TRADER'),
    ('a1000000-0000-0000-0000-000000000002', 'Bob Trader', 'TRADER'),
    ('a1000000-0000-0000-0000-000000000003', 'Charlie Trader', 'TRADER'),
    ('a1000000-0000-0000-0000-000000000004', 'Diana Trader', 'TRADER'),
    ('a1000000-0000-0000-0000-000000000005', 'Ethan Trader', 'TRADER'),
    ('a1000000-0000-0000-0000-000000000006', 'System Admin', 'ADMIN'),
    ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Third Party Maker', 'BOT')
ON CONFLICT (name) DO NOTHING;

-- Initial Balances (100,000 USDT each for traders)
INSERT INTO balances (account_id, asset, available) VALUES
    ('a1000000-0000-0000-0000-000000000001', 'USDT', 100000.00),
    ('a1000000-0000-0000-0000-000000000002', 'USDT', 100000.00),
    ('a1000000-0000-0000-0000-000000000003', 'USDT', 100000.00),
    ('a1000000-0000-0000-0000-000000000004', 'USDT', 100000.00),
    ('a1000000-0000-0000-0000-000000000005', 'USDT', 100000.00),
    ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'USDT', 1000000000.00),
    ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'BTC', 1000000.00),
    ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'ETH', 1000000.00),
    ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'AAPL', 1000000.00),
    ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'TSLA', 1000000.00),
    ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'SOL', 1000000.00)
ON CONFLICT (account_id, asset) DO NOTHING;

-- Symbols
INSERT INTO symbols (id, base_currency, quote_currency, last_price, best_bid, best_ask) VALUES
    ('BTCUSDT', 'BTC', 'USDT', 67500.00, 67495.00, 67505.00),
    ('ETHUSDT', 'ETH', 'USDT', 3850.00, 3849.00, 3851.00),
    ('AAPL', 'AAPL', 'USDT', 189.50, 189.40, 189.60),
    ('TSLA', 'TSLA', 'USDT', 175.30, 175.20, 175.40),
    ('SOLUSDT', 'SOL', 'USDT', 175.80, 175.75, 175.85)
ON CONFLICT (id) DO NOTHING;
