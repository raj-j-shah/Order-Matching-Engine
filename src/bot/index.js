import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import { Kafka } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROTO_PATH = path.join(__dirname, 'proto', 'market.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true, longs: String, enums: String, defaults: true, oneofs: true
});
const marketProto = grpc.loadPackageDefinition(packageDefinition).market;

const MARKET_DATA_URL = process.env.MARKET_DATA_URL || 'localhost:9002';
const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || 'localhost:29092').split(',');
const ENABLE_BOT = process.env.ENABLE_BOT !== 'false';

const marketClient = new marketProto.MarketDataService(MARKET_DATA_URL, grpc.credentials.createInsecure());

const kafka = new Kafka({ clientId: 'bot-service', brokers: KAFKA_BROKERS });
const producer = kafka.producer();

const BOT_ACCOUNT_ID = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
const activeSymbols = new Set();
const symbolTasks = new Map();

async function getActiveSymbols() {
    return new Promise((resolve, reject) => {
        marketClient.getActiveSymbols({}, (error, response) => {
            if (error) reject(error);
            else resolve(response.symbols || []);
        });
    });
}

function startSymbolTask(symbolId, lastPriceStr) {
    if (symbolTasks.has(symbolId)) return;
    
    let midPrice = lastPriceStr && parseFloat(lastPriceStr) > 0 ? parseFloat(lastPriceStr) : 50000.0;
    
    console.log(`Starting market making for ${symbolId} around ${midPrice}`);
    
    const activeOrders = []; // { id, side, price, qty }
    
    const interval = setInterval(async () => {
        try {
            // Random walk midPrice
            const change = midPrice * (Math.random() * 0.002 - 0.001); // +/- 0.1%
            midPrice += change;
            if (midPrice < 1) midPrice = 1;
            
            // 1. Maybe cancel an old order
            if (activeOrders.length > 20 || Math.random() < 0.3) {
                if (activeOrders.length > 0) {
                    const toCancel = activeOrders.shift();
                    await cancelOrder(symbolId, toCancel.id);
                }
            }
            
            // 2. Place new orders
            // Spread between 0.05% and 0.5%
            const spreadPct = Math.random() * 0.0045 + 0.0005;
            const spread = midPrice * spreadPct;
            const bidPrice = midPrice - spread / 2;
            const askPrice = midPrice + spread / 2;
            
            // Generate a hyperbola-like curve for quantity
            // Further away from mid price -> exponentially larger quantity
            // spreadPct goes from 0.0005 to 0.005. So multiplier goes from ~1 to ~100
            const multiplier = Math.pow(spreadPct / 0.0005, 2); 
            
            const bidQty = ((Math.random() * 0.5 + 0.1) * multiplier).toFixed(4);
            const askQty = ((Math.random() * 0.5 + 0.1) * multiplier).toFixed(4);
            
            const bidOrderId = uuidv4();
            const askOrderId = uuidv4();
            
            await placeOrder(bidOrderId, symbolId, 'BUY', bidPrice.toFixed(2), bidQty);
            await placeOrder(askOrderId, symbolId, 'SELL', askPrice.toFixed(2), askQty);
            
            activeOrders.push({ id: bidOrderId, side: 'BUY', price: bidPrice, qty: parseFloat(bidQty) });
            activeOrders.push({ id: askOrderId, side: 'SELL', price: askPrice, qty: parseFloat(askQty) });
            
        } catch (err) {
            console.error(`Error in task for ${symbolId}:`, err);
        }
    }, 2000);
    
    symbolTasks.set(symbolId, interval);
}

async function placeOrder(orderId, symbolId, side, price, quantity) {
    const event = {
        orderId,
        accountId: BOT_ACCOUNT_ID,
        symbolId,
        side,
        orderType: 'LIMIT',
        quantity,
        price,
        timestamp: Date.now()
    };
    
    await producer.send({
        topic: 'orders.validated',
        messages: [{ key: symbolId, value: JSON.stringify(event) }]
    });
    // console.log(`Placed ${side} ${quantity} @ ${price} on ${symbolId}`);
}

async function cancelOrder(symbolId, orderId) {
    const event = {
        orderId,
        accountId: BOT_ACCOUNT_ID,
        symbolId,
        timestamp: Date.now()
    };
    await producer.send({
        topic: 'orders.cancel',
        messages: [{ key: symbolId, value: JSON.stringify(event) }]
    });
    // console.log(`Cancelled order ${orderId} on ${symbolId}`);
}

async function main() {
    if (!ENABLE_BOT) {
        console.log("Trading bot is disabled via ENABLE_BOT=false. Exiting...");
        return;
    }
    await producer.connect();
    console.log("Bot connected to Kafka");
    
    setInterval(async () => {
        try {
            const symbols = await getActiveSymbols();
            const newIds = new Set(symbols.map(s => s.symbol_id));
            
            for (const sym of symbols) {
                if (!activeSymbols.has(sym.symbol_id)) {
                    activeSymbols.add(sym.symbol_id);
                    const snapshot = sym.price_snapshot || {};
                    startSymbolTask(sym.symbol_id, snapshot.last_price);
                }
            }
            
            for (const symId of activeSymbols) {
                if (!newIds.has(symId)) {
                    // Symbol removed
                    clearInterval(symbolTasks.get(symId));
                    symbolTasks.delete(symId);
                    activeSymbols.delete(symId);
                    console.log(`Stopped market making for ${symId}`);
                }
            }
        } catch (err) {
            console.error("Error fetching symbols:", err);
        }
    }, 10000);
    
    // Initial fetch
    try {
        const symbols = await getActiveSymbols();
        for (const sym of symbols) {
            activeSymbols.add(sym.symbol_id);
            const snapshot = sym.price_snapshot || {};
            startSymbolTask(sym.symbol_id, snapshot.last_price);
        }
    } catch (e) {
        console.error("Initial fetch failed", e);
    }
}

main().catch(console.error);
