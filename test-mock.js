#!/usr/bin/env node

/**
 * Mock Transfer API Endpoint for Testing
 *
 * This creates a simple mock server to test the transfer functionality
 * without needing the real backend.
 *
 * Usage: node test-mock.js
 */

const http = require('http');

const PORT = 3001;

const mockTransferHandler = (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/api/wallet/transfer') {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const { fromAddress, toAddress, amount, tokenType } = data;

        // Simulate validation
        if (!fromAddress || !toAddress || !amount || !tokenType) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing required fields' }));
          return;
        }

        if (toAddress.length < 32 || toAddress.length > 44) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid recipient address' }));
          return;
        }

        if (amount <= 0) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Amount must be greater than 0' }));
          return;
        }

        // Simulate random failure (10% chance)
        if (Math.random() < 0.1) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Blockchain transaction failed. Please try again.' }));
          return;
        }

        // Simulate processing delay
        setTimeout(() => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            transactionHash: 'mock_' + Math.random().toString(36).substring(7),
            message: `Successfully transferred ${amount} ${tokenType}`
          }));
        }, 1500); // 1.5 second delay to simulate blockchain

      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });

  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
};

const server = http.createServer(mockTransferHandler);

server.listen(PORT, () => {
  console.log('\n🚀 Mock Transfer API Server Running');
  console.log(`   Port: ${PORT}`);
  console.log(`   Endpoint: http://localhost:${PORT}/api/wallet/transfer`);
  console.log('\n📝 To use this mock in your app:');
  console.log(`   Update .env.local:`);
  console.log(`   NEXT_PUBLIC_API_URL=http://localhost:${PORT}`);
  console.log('\n⚡ Press Ctrl+C to stop\n');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Try a different port.`);
  } else {
    console.error('❌ Server error:', err);
  }
  process.exit(1);
});
