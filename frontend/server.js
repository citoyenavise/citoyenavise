import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 10000;
const HOST = process.env.HOST || '0.0.0.0';

const server = http.createServer((req, res) => {
  let filePath = path.join(__dirname, 'dist', req.url === '/' ? 'index.html' : req.url);

  // Security: prevent directory traversal
  const realPath = path.resolve(filePath);
  if (!realPath.startsWith(path.resolve(path.join(__dirname, 'dist')))) {
    filePath = path.join(__dirname, 'dist', 'index.html');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // SPA: serve index.html for all non-existent files
      res.writeHead(200, { 'Content-Type': 'text/html' });
      fs.readFile(path.join(__dirname, 'dist', 'index.html'), (err, data) => {
        res.end(data);
      });
    } else {
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
      };
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log(`🚀 Frontend server running on http://${HOST}:${PORT}`);
});
