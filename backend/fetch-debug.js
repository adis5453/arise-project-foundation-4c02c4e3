const http = require('http');

http.get('http://localhost:3000/api/debug/users', (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => console.log(JSON.stringify(JSON.parse(body), null, 2)));
}).on('error', console.error);
