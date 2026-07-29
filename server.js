import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

console.log(`🚀 Starting server...`);
console.log(`📂 Current directory: ${__dirname}`);
console.log(`🔌 PORT: ${PORT}`);

// Check if dist folder exists
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  console.log(`✅ dist folder found at: ${distPath}`);
} else {
  console.log(`❌ dist folder NOT found at: ${distPath}`);
  console.log(`📁 Contents of /app:`);
  try {
    const files = fs.readdirSync(__dirname);
    console.log(files);
  } catch (err) {
    console.log(`❌ Cannot read directory: ${err}`);
  }
}

// Serve static files
app.use(express.static(distPath));

// Health check endpoint
app.get('/health', (req, res) => {
  console.log(`🩺 Health check requested`);
  res.status(200).send('OK');
});

// Catch-all route
app.get('*', (req, res) => {
  console.log(`🌐 Request for: ${req.url}`);
  const indexPath = path.resolve(__dirname, 'dist', 'index.html');
  console.log(`📄 Looking for: ${indexPath}`);
  
  if (fs.existsSync(indexPath)) {
    console.log(`✅ Sending index.html`);
    res.sendFile(indexPath);
  } else {
    console.log(`❌ index.html NOT found at: ${indexPath}`);
    res.status(404).send(`<h1>404 - index.html not found</h1><p>Looking at: ${indexPath}</p>`);
  }
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🩺 Health check: /health`);
  console.log(`🌐 Main route: /`);
});

// Handle shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, closing gracefully...');
  server.close(() => {
    console.log('👋 Server closed');
    process.exit(0);
  });
});

process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
});
