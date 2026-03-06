const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const VOTES_FILE = path.join(__dirname, 'votes.json');

const candidates = ['Faith', 'Brave', 'Rutendo', 'Allan', 'Nyasha'];
const positions = ['CEO', 'CTO', 'HR'];

function loadVotes() {
    try {
        return JSON.parse(fs.readFileSync(VOTES_FILE, 'utf8'));
    } catch {
        const data = {};
        positions.forEach(pos => {
            data[pos] = {};
            candidates.forEach(c => data[pos][c] = 0);
        });
        fs.writeFileSync(VOTES_FILE, JSON.stringify(data, null, 2));
        return data;
    }
}

function saveVotes(votes) {
    fs.writeFileSync(VOTES_FILE, JSON.stringify(votes, null, 2));
}

const server = http.createServer((req, res) => {
    // Serve the HTML page
    if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
        const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
        return;
    }

    // Get current votes
    if (req.method === 'GET' && req.url === '/votes') {
        const votes = loadVotes();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(votes));
        return;
    }

    // Cast a vote
    if (req.method === 'POST' && req.url === '/vote') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { position, candidate, previous } = JSON.parse(body);
                if (!positions.includes(position) || !candidates.includes(candidate)) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Invalid position or candidate' }));
                    return;
                }
                const votes = loadVotes();
                if (previous && candidates.includes(previous)) {
                    votes[position][previous] = Math.max(0, votes[position][previous] - 1);
                }
                votes[position][candidate]++;
                saveVotes(votes);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(votes));
            } catch {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Bad request' }));
            }
        });
        return;
    }

    res.writeHead(404);
    res.end('Not found');
});

server.listen(PORT, () => {
    console.log(`Voting server running at http://localhost:${PORT}`);
});
