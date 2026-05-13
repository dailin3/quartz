const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const PUBLIC_DIR = path.join(__dirname, 'public');

const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml',
};

const server = http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0];
  // Remove trailing slash unless root
  if (urlPath !== '/' && urlPath.endsWith('/')) {
    urlPath = urlPath.slice(0, -1);
  }

  let filePath = path.join(PUBLIC_DIR, urlPath);

  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isFile()) {
      serveFile(filePath, res);
    } else {
      // Try with .html extension
      const htmlPath = filePath + '.html';
      fs.stat(htmlPath, (err2, stats2) => {
        if (!err2 && stats2.isFile()) {
          serveFile(htmlPath, res);
        } else {
          // Try index.html inside directory
          const dirIndex = filePath + '/index.html';
          fs.stat(dirIndex, (err3, stats3) => {
            if (!err3 && stats3.isFile()) {
              serveFile(dirIndex, res);
            } else {
              // SPA fallback to root index.html
              const indexPath = path.join(PUBLIC_DIR, 'index.html');
              serveFile(indexPath, res);
            }
          });
        }
      });
    }
  });
});

function serveFile(filePath, res) {
  const ext = path.extname(filePath);
  const mime = mimeTypes[ext] || 'text/plain';
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500);
      res.end('Server Error: ' + err.code);
      return;
    }
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
}

// Debug logging
server.on('request', (req, res) => {
  console.log(`${req.method} ${req.url}`);
});

server.listen(PORT, () => {
  console.log(`Quartz local server running at http://localhost:${PORT}`);
});
