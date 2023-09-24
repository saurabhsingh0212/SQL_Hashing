const http = require('http');
const url = require('url');
const querystring = require('querystring');
const fs = require('fs');
const path = require('path');
const { parse, format } = require('node-sqlparser');
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();

// Create an SQLite database to store column mappings
const db = new sqlite3.Database('./column_mappings.db');

// Create a table to store column mappings if it doesn't exist
db.serialize(() => {
  db.run('CREATE TABLE IF NOT EXISTS mappings (original TEXT, hashed TEXT)');
});

// Function to hash a string
function hashString(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

// HTTP server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  const pathname = parsedUrl.pathname;

  if (req.method === 'POST' && pathname === '/api/modify-sql') {
    console.log("hello")
    let body = '';

    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', () => {
      console.log(querystring.parse(body));
      const requestBody = querystring.parse(body);
      const sqlQuery = requestBody.sqlQuery;

      // Parse SQL to AST
      const ast = parse(sqlQuery);

      const columnMap = {};

      // Modify AST by hashing column names and updating the map
      ast.forEach((item) => {
        if (item.type === 'column_ref') {
          const originalName = item.table + '.' + item.column;
          const hashedName = hashString(originalName);
          item.table = ''; // Empty table name
          item.column = hashedName;
          columnMap[originalName] = hashedName;
        }
      });

      // Rebuild SQL from the modified AST
      const modifiedSQL = format(ast);

      // Store the column mappings in the database
      Object.keys(columnMap).forEach((original) => {
        const hashed = columnMap[original];
        db.run('INSERT INTO mappings (original, hashed) VALUES (?, ?)', [original, hashed]);
      });

      // Send the modified SQL and column map as a JSON response
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ modifiedSQL, columnMap }));
    });
  } else {
    // Serve your frontend files (assuming React build files are in the "client/build" directory)
    const filePath = path.join(__dirname, '../client/build', pathname === '/' ? 'index.html' : pathname);

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not Found');
        return;
      }

      res.writeHead(200);
      res.end(data);
    });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
