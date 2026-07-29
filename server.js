import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

console.log(`Current directory: ${__dirname}`);

// Check if dist folder exists
const distPath = path.join(__dirname, 'dist');
if (!fs.existsSync(distPath)) {
  console.log(`❌ dist folder NOT found at: ${distPath}`);
  console.log(`Creating dist folder...`);
  fs.mkdirSync(distPath);
  console.log(`✅ dist folder created`);
} else {
  console.log(`✅ dist folder found at: ${distPath}`);
}

// Serve static files
app.use(express.static(distPath));

// Health check
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Catch-all route
app.get('*', (req, res) => {
  const indexPath = path.resolve(__dirname, 'dist', 'index.html');
  console.log(`Serving index.html from: ${indexPath}`);
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    console.log(`❌ index.html NOT found at: ${indexPath}`);
    res.status(404).send(`
      <h1>index.html not found</h1>
      <p>Looking at: ${indexPath}</p>
      <p>Current directory: ${__dirname}</p>
    `);
  }
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Health check available at /health`);
});

// Handle shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, closing gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
