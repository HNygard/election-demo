import express from 'express';
import cors from 'cors';
import geoip from 'geoip-lite';
import morgan from 'morgan';
import { readFileSync, writeFileSync } from 'fs';
import QRCode from 'qrcode';
import path from 'path';
import { fileURLToPath } from 'url';
import { marked } from 'marked';
import { generateMockVotes } from './mockData.js';
import { url } from 'inspector';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Load elections configuration
const elections = JSON.parse(readFileSync(path.join(__dirname, '../data/elections.json'), 'utf8')).elections;

// In-memory storage
const votes = new Map();
const voterInfo = new Map();
const privacyPolicyViews = new Map();
const privacyPolicyCodes = new Map();

// Simulate votes over time
let votingStarted = false;
let votingInterval;

function startVotingSimulation() {
  if (votingStarted) return;
  votingStarted = true;

  // Initial batch of votes (smaller)
  const { votes: initialVotes, voterInfo: initialInfo } = generateMockVotes(30);
  initialVotes.forEach((value, key) => votes.set(key, value));
  initialInfo.forEach((value, key) => voterInfo.set(key, value));
  
  // Add more votes every few seconds
  votingInterval = setInterval(() => {
    console.log('Adding more votes...');
    // Generate 5-15 votes each interval
    const batchSize = Math.floor(Math.random() * 10) + 5;
    const { votes: newVotes, voterInfo: newInfo } = generateMockVotes(batchSize);
    
    newVotes.forEach((value, key) => votes.set(key, value));
    newInfo.forEach((value, key) => voterInfo.set(key, value));
    
    // Stop after reaching ~150 total votes
    if (votes.size >= 150) {
      console.log('Simulation completed. Total votes:', votes.size);
      // Clear the interval
      clearInterval(votingInterval);
      votingStarted = false;
    }
  }, 1000); // Add votes every 10 seconds
}

// Serve QR code
app.get('/api/qr-code', async (req, res) => {
  try {
    const qrUrl = 'https://election.hnygard.no/';
    const qrDataUrl = await QRCode.toDataURL(qrUrl, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 200
    });
    res.json({ 
      png: qrDataUrl,
      url: qrUrl
     });
  } catch (err) {
    console.error('Error generating QR code:', err);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// Call startVotingSimulation once on server start
startVotingSimulation();

// Request logging
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :remote-addr'));

app.use(cors());
app.use(express.json());

// Endpoint to start voting simulation
app.post('/api/simulation/start', (req, res) => {
  startVotingSimulation();
  res.json({ 
    success: true, 
    message: 'Voting simulation started',
    active: votingStarted,
    totalVotes: votes.size,
    targetVotes: 150
  });
});

// Middleware to collect user data
app.use((req, res, next) => {
  const ip = req.ip;
  const userAgent = req.get('User-Agent');
  const language = req.get('Accept-Language');
  const geo = geoip.lookup(ip);
  
  // Check if the user agent indicates an iOS device
  const isIphone = /iPhone|iPad|iPod/i.test(userAgent);
  
  req.voterData = {
    ip,
    userAgent,
    language,
    isp: geo?.organization,
    country: geo?.country,
    timestamp: new Date().toISOString(),
    isIphone: isIphone,
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
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body>
        <style>
        h2 {
          text-align: left;
        }
        p {
          margin: 1em;
        }
        ul {
          margin: 1em;
        }

        #beerForm {
          max-width: 400px;
          padding: 1.5rem;
          border-radius: 12px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        }
        
        #nameInput {
          width: 100%;
          padding: 0.75rem;
          font-size: 1rem;
          border: 1px solid #ccc;
          border-radius: 8px;
          box-sizing: border-box;
          margin-bottom: 1rem;
          transition: border-color 0.3s;
        }
        
        #nameInput:focus {
          border-color: #4a90e2;
          outline: none;
        }
        
        #beerForm button {
          width: 100%;
          padding: 0.75rem;
          background-color: #4a90e2;
          color: white;
          font-size: 1rem;
          font-weight: bold;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        #beerForm button:hover {
          background-color: #357ab8;
        }
        
        #codeResult {
          background-color: #f1f1f1;
          padding: 1rem;
          border-radius: 8px;
          font-family: monospace;
          font-size: 0.9rem;
          color: #333;
          word-break: break-word;
        }
        @keyframes highlight-blink {
          0%   { background-color: #ffff99; }
          50%  { background-color: #fff; }
          100% { background-color: #f1f1f1; }
        }
        
        #codeResult.blink {
          animation: highlight-blink 1s ease;
        }
        </style>
        <div class="container">
          ${content}
          <div id="beerForm">
              <input type="text" id="nameInput" placeholder="Enter your name" />
              <button onclick="generateCode()">Generate Code</button>
              <div id="codeResult" style="margin-top: 1rem; display: none;"></div>
          </div>
        </div>
        <script>
          // Check if code has already been generated on page load
          document.addEventListener('DOMContentLoaded', function() {
            if (sessionStorage.getItem('privacyCodeGenerated')) {
              const savedCode = sessionStorage.getItem('privacyCode');
              if (savedCode) {
                displayCode(savedCode);
              }
            }
          });
          
          // Function to display the code
          function displayCode(code) {
            const result = document.getElementById('codeResult');
            result.innerHTML = \`Your code: <strong>\${code}</strong><br>Show this to Hallvard for your beer!\`;
            result.style.display = 'block';
            
            // Scroll smoothly to the result box
            result.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
            // Trigger blink animation
            result.classList.remove('blink'); // Reset if already applied
            void result.offsetWidth;          // Force reflow to restart animation
            result.classList.add('blink');
          }
          
          async function generateCode() {
            // Check if code has already been generated
            if (sessionStorage.getItem('privacyCodeGenerated')) {
              alert('You have already generated a code. You can only generate one code per session.');
              return;
            }
            
            const name = document.getElementById('nameInput').value;
            if (!name) {
              alert('Please enter your name');
              return;
            }
            
            try {
              const response = await fetch('/api/privacy-code', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name })
              });
              
              if (!response.ok) {
                throw new Error('Failed to save code');
              }
              
              const data = await response.json();
              
              // Save to session storage to prevent multiple submissions
              sessionStorage.setItem('privacyCodeGenerated', 'true');
              sessionStorage.setItem('privacyCode', data.code);
              
              // Display the code
              displayCode(data.code);
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
  
  const voteData = {
    electionId,
    answers,
    timestamp: new Date().toISOString(),
    isIphone: req.voterData.isIphone
  };
  
  // Store vote with voter info
  votes.set(verificationCode, voteData);
  
  // Store voter info separately
  voterInfo.set(verificationCode, req.voterData);
  
  // Log vote and voter information to stdout
  console.log('New vote received:', {
    verificationCode,
    vote: voteData,
    voterInfo: req.voterData
  });
  
  res.json({ 
    success: true,
    verificationCode,
    isIphone: req.voterData.isIphone,
    message: 'Vote recorded successfully'
  });
});

// Get election results (for demo/admin purposes)
// Filter votes based on exclusion criteria
function getFilteredVotes(allVotes, excludeType) {
  if (!excludeType) return allVotes;
  
  return allVotes.filter(vote => {
    // Find verification code for this vote by matching vote properties
    let matchingCode = null;
    for (const [code, voteData] of votes.entries()) {
      // Compare key properties to find matching vote
      if (voteData.electionId === vote.electionId && 
          voteData.timestamp === vote.timestamp &&
          JSON.stringify(voteData.answers) === JSON.stringify(vote.answers)) {
        matchingCode = code;
        break;
      }
    }
    
    if (!matchingCode) {
      return true; // Include if no voter info found
    }
    
    const info = voterInfo.get(matchingCode);
    if (!info) {
      return true; // Include if no voter info found
    }
    
    switch (excludeType) {
      case 'iphone':
        return !info.isIphone;
      case 'telenor':
        return !info.isp.toLowerCase().includes('telenor');
      case 'norway':
        return info.country !== 'NO';
      case 'germany':
        return info.country !== 'DE';
      case 'telia':
        return !info.isp.toLowerCase().includes('telia');
      case 'o2':
        return !info.isp.toLowerCase().includes('o2');
      default:
        return true; // No exclusion
    }
  });
}

app.get('/api/results/:electionId', (req, res) => {
  const { electionId } = req.params;
  const { exclude } = req.query;
  
  if (!elections[electionId]) {
    return res.status(404).json({ error: 'Election not found' });
  }
  
  const electionVotes = Array.from(votes.values())
    .filter(vote => vote.electionId === electionId);
  
  // All votes (no exclusions)
  const resultsWithAll = {};
  elections[electionId].questions.forEach((q, qIndex) => {
    resultsWithAll[qIndex] = {};
    q.options.forEach(option => {
      resultsWithAll[qIndex][option] = electionVotes.filter(v => v.answers[qIndex] === option).length;
    });
  });
  
  // Filtered votes based on exclusion criteria
  const filteredVotes = getFilteredVotes(electionVotes, exclude);
  const resultsWithoutExcluded = {};
  
  // Calculate total votes
  const totalVotes = electionVotes.length;
  const filteredTotal = filteredVotes.length;
  const excludedCount = totalVotes - filteredTotal;
  
  // Calculate results without excluded votes but adjust to maintain the same total
  elections[electionId].questions.forEach((q, qIndex) => {
    resultsWithoutExcluded[qIndex] = {};
    
    // First, count actual filtered votes for each option
    const actualCounts = {};
    let actualTotal = 0;
    
    q.options.forEach(option => {
      const count = filteredVotes.filter(v => v.answers[qIndex] === option).length;
      actualCounts[option] = count;
      actualTotal += count;
    });
    
    // Then adjust proportionally to match the original total
    q.options.forEach(option => {
      if (actualTotal === 0) {
        // If no filtered votes, distribute evenly
        resultsWithoutExcluded[qIndex][option] = Math.round(totalVotes / q.options.length);
      } else {
        // Otherwise, adjust proportionally
        const proportion = actualCounts[option] / actualTotal;
        resultsWithoutExcluded[qIndex][option] = Math.round(proportion * totalVotes);
      }
    });
    
    // Ensure the total matches by adjusting the first option if needed
    const adjustedTotal = Object.values(resultsWithoutExcluded[qIndex]).reduce((a, b) => a + b, 0);
    if (adjustedTotal !== totalVotes && q.options.length > 0) {
      const diff = totalVotes - adjustedTotal;
      resultsWithoutExcluded[qIndex][q.options[0]] += diff;
    }
  });
  
  res.json({
    withoutExcluded: resultsWithoutExcluded,
    withAll: resultsWithAll,
    // Keep backward compatibility with original field names
    withoutIphone: resultsWithoutExcluded,
    withIphone: resultsWithAll,
    totalVotes: totalVotes,
    filteredVotes: filteredTotal,
    excludedVotes: excludedCount,
    // Keep backward compatibility
    nonIphoneVotes: filteredTotal,
    iphoneVotes: excludedCount,
    excludeType: exclude || 'none'
  });
});

// Get voter information (for demo/admin purposes)
app.get('/api/voter-info', (req, res) => {
  const voterData = Array.from(voterInfo.values());
  res.json(voterData);
});

// Get privacy policy views (for demo purposes)
app.get('/api/privacy-views', (req, res) => {
  var privacyViews = {
    totalViews: privacyPolicyViews.size,
    totalSubmits: privacyPolicyCodes.size,
    views: Array.from(privacyPolicyViews.values()),
    codes: Array.from(privacyPolicyCodes.values())
  }
  res.json(privacyViews);
});

// Save privacy policy code
app.post('/api/privacy-code', (req, res) => {
  const { name } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  
  const code = 'CAT' + Math.random().toString(36).substring(2, 8).toUpperCase();
  
  privacyPolicyCodes.set(code, {
    name,
    code,
    ...req.voterData
  });
  
  res.json({ success: true, message: 'Code saved successfully', code });
});

// Get privacy policy codes (for demo purposes)
app.get('/api/privacy-codes', (req, res) => {
  const codes = Array.from(privacyPolicyCodes.values());
  res.json(codes);
});

// Get simulation status (for demo purposes)
app.get('/api/simulation/status', (req, res) => {
  res.json({
    active: votingStarted,
    totalVotes: votes.size,
    targetVotes: 150
  });
});

// Clear all data and restart simulation (for demo purposes)
app.post('/api/reset', (req, res) => {
  // Clear all data
  votes.clear();
  voterInfo.clear();
  privacyPolicyViews.clear();
  privacyPolicyCodes.clear();
  
  // Clear existing interval if any
  if (votingInterval) {
    clearInterval(votingInterval);
    votingStarted = false;
  }
  
  res.json({ success: true, message: 'All data cleared and voting simulation restarted' });
});

app.listen(port, () => {
  console.log(`Election backend running on port ${port}`);
});
