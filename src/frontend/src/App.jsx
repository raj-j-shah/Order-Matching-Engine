import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TradingProvider } from './context/TradingContext';
import { Layout } from './components/layout/Layout';
import { TradingPage } from './pages/TradingPage';
import { OrdersPage } from './pages/OrdersPage';
import { TradeHistoryPage } from './pages/TradeHistoryPage';
import { PortfolioPage } from './pages/PortfolioPage';
import { AdminPage } from './pages/AdminPage';
import './App.css';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <TradingProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<TradingPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/history" element={<TradeHistoryPage />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Route>
        </Routes>
      </TradingProvider>
    </BrowserRouter>
  );
}
