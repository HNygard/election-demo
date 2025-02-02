import express from 'express';
import cors from 'cors';
import geoip from 'geoip-lite';
import morgan from 'morgan';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { marked } from 'marked';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Load elections configuration
const elections = JSON.parse(readFileSync(path.join(__dirname, '../elections.json'), 'utf8')).elections;

// In-memory storage
const votes = new Map();
const voterInfo = new Map();
const privacyPolicyViews = new Map();
const privacyPolicyCodes = new Map();

// Request logging
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :remote-addr'));

app.use(cors());
app.use(express.json());

// Middleware to collect user data
app.use((req, res, next) => {
  const ip = req.ip;
  const userAgent = req.get('User-Agent');
  const language = req.get('Accept-Language');
  const geo = geoip.lookup(ip);
  
  req.voterData = {
    ip,
    userAgent,
    language,
    isp: geo?.organization,
    country: geo?.country,
    timestamp: new Date().toISOString()
  };
  
  next();
});

// Serve static files from www-root directory
app.use(express.static(path.join(__dirname, '../www-root')));

// Serve privacy policy
app.get('/privacy-policy', (req, res) => {
  const markdown = readFileSync(path.join(__dirname, '../privacy-policy.md'), 'utf-8');
  const content = marked(markdown);
  
  // Record privacy policy view
  const viewId = Math.random().toString(36).substring(2, 15);
  privacyPolicyViews.set(viewId, {
    ...req.voterData,
    viewId
  });
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Privacy Policy</title>
        <link rel="stylesheet" href="styles.css">
      </head>
      <body>
        <div class="container">
          ${content}
        </div>
        <script>
          async function generateCode() {
            const name = document.getElementById('nameInput').value;
            if (!name) {
              alert('Please enter your name');
              return;
            }
            const code = Math.random().toString(36).substring(2, 8).toUpperCase();
            
            try {
              const response = await fetch('/api/privacy-code', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, code })
              });
              
              if (!response.ok) {
                throw new Error('Failed to save code');
              }
              
              const result = document.getElementById('codeResult');
              result.innerHTML = \`Your code: <strong>\${code}</strong><br>Show this to Hallvard for your beer!\`;
              result.style.display = 'block';
            } catch (error) {
              alert('Failed to save code. Please try again.');
            }
          }
        </script>
      </body>
    </html>
  `;
  res.send(html);
});

// Get available elections
app.get('/api/elections', (req, res) => {
  res.json(elections);
});

// Submit a vote
app.post('/api/vote/:electionId', (req, res) => {
  const { electionId } = req.params;
  const { answers } = req.body;
  
  if (!elections[electionId]) {
    return res.status(404).json({ error: 'Election not found' });
  }

  // Generate a "verification" code (for demo purposes)
  const verificationCode = Math.random().toString(36).substring(2, 15);
  
  // Store vote with voter info
  votes.set(verificationCode, {
    electionId,
    answers,
    timestamp: new Date().toISOString()
  });
  
  // Store voter info separately
  voterInfo.set(verificationCode, req.voterData);
  
  res.json({ 
    success: true,
    verificationCode,
    message: 'Vote recorded successfully'
  });
});

// Get election results (for demo/admin purposes)
app.get('/api/results/:electionId', (req, res) => {
  const { electionId } = req.params;
  
  if (!elections[electionId]) {
    return res.status(404).json({ error: 'Election not found' });
  }
  
  const electionVotes = Array.from(votes.values())
    .filter(vote => vote.electionId === electionId);
  
  // Count votes for each option
  const results = {};
  elections[electionId].questions.forEach((q, qIndex) => {
    results[qIndex] = {};
    q.options.forEach(option => {
      results[qIndex][option] = electionVotes.filter(v => v.answers[qIndex] === option).length;
    });
  });
  
  res.json(results);
});

// Get voter information (for demo/admin purposes)
app.get('/api/voter-info', (req, res) => {
  const voterData = Array.from(voterInfo.values());
  res.json(voterData);
});

// Get privacy policy views (for demo purposes)
app.get('/api/privacy-views', (req, res) => {
  const views = Array.from(privacyPolicyViews.values());
  res.json(views);
});

// Save privacy policy code
app.post('/api/privacy-code', (req, res) => {
  const { name, code } = req.body;
  
  if (!name || !code) {
    return res.status(400).json({ error: 'Name and code are required' });
  }
  
  privacyPolicyCodes.set(code, {
    name,
    code,
    ...req.voterData
  });
  
  res.json({ success: true, message: 'Code saved successfully' });
});

// Get privacy policy codes (for demo purposes)
app.get('/api/privacy-codes', (req, res) => {
  const codes = Array.from(privacyPolicyCodes.values());
  res.json(codes);
});

// Clear all data (for demo purposes)
app.post('/api/reset', (req, res) => {
  votes.clear();
  voterInfo.clear();
  privacyPolicyViews.clear();
  privacyPolicyCodes.clear();
  res.json({ success: true, message: 'All data cleared' });
});

app.listen(port, () => {
  console.log(`Election backend running on port ${port}`);
});
