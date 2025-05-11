import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load elections configuration
const election_settings = JSON.parse(readFileSync(path.join(__dirname, '../data/elections.json'), 'utf8'));
const elections = election_settings.elections;

const countries = {
  'NO': { weight: 30, language: 'nb-NO', isps: ['Telenor ASA', 'Telia Norge AS', 'Ice Norge AS'] },
  'SE': { weight: 15, language: 'sv-SE', isps: ['Telia Sverige AB', 'Telenor Sverige AB', 'Tele2 Sverige AB'] },
  'DK': { weight: 15, language: 'da-DK', isps: ['TDC A/S', 'Telenor Danmark', 'Telia Danmark'] },
  'FI': { weight: 10, language: 'fi-FI', isps: ['DNA Oyj', 'Elisa Oyj', 'Telia Finland Oyj'] },
  'DE': { weight: 10, language: 'de-DE', isps: ['Deutsche Telekom AG', 'Vodafone GmbH', 'O2 Deutschland'] },
  'GB': { weight: 10, language: 'en-GB', isps: ['BT Group plc', 'Vodafone UK', 'EE Limited'] },
  'US': { weight: 5, language: 'en-US', isps: ['Comcast', 'AT&T', 'Verizon'] },
  'NL': { weight: 5, language: 'nl-NL', isps: ['KPN', 'Vodafone NL', 'T-Mobile NL'] }
};

const browsers = [
  {
    name: 'Chrome',
    weight: 40,
    versions: ['119.0.0.0', '120.0.0.0', '121.0.0.0'],
    format: (version) => `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version} Safari/537.36`
  },
  {
    name: 'Firefox',
    weight: 30,
    versions: ['120.0', '121.0', '122.0'],
    format: (version) => `Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:${version}) Gecko/20100101 Firefox/${version}`
  },
  {
    name: 'Safari',
    weight: 20,
    versions: ['17.0', '16.6', '16.5'],
    format: (version) => `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${version} Safari/605.1.15`
  },
  {
    name: 'Edge',
    weight: 10,
    versions: ['120.0.0.0', '121.0.0.0'],
    format: (version) => `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version} Safari/537.36 Edg/${version}`
  }
];

/*
const voteOptions = [
  { option: 'C#', weight: 20 },
  { option: 'Java', weight: 15 },
  { option: 'Javascript', weight: 25 },
  { option: 'Python', weight: 20 },
  { option: 'PHP', weight: 15 },
  { option: 'I only prompt', weight: 5 }
]; */

const voteOptions = []


elections[election_settings.current_election].questions[0].options.forEach((answer) => {
  voteOptions.push(
    { option: answer, weight: 15 },
  )
});

function weightedRandom(items) {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const item of items) {
    random -= item.weight;
    if (random <= 0) {
      return item;
    }
  }
  return items[0];
}

function generateIP(countryCode) {
  // Generate IP that looks somewhat realistic for the country
  const ranges = {
    'NO': ['77.16', '84.208', '193.212'],
    'SE': ['78.67', '83.140', '192.176'],
    'DK': ['77.241', '83.151', '194.255'],
    'FI': ['77.86', '82.133', '193.166'],
    'DE': ['77.185', '84.134', '194.25'],
    'GB': ['77.98', '82.132', '192.168'],
    'US': ['64.233', '72.14', '192.158'],
    'NL': ['77.161', '83.84', '194.109']
  };

  const range = ranges[countryCode] || ranges['US'];
  const prefix = range[Math.floor(Math.random() * range.length)];
  const suffix = `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
  return `${prefix}.${suffix}`;
}

function generateTimestamp() {
  // Generate timestamps within the last few minutes to simulate live voting
  const now = new Date();
  const fiveMinutesAgo = new Date(now - 5 * 60 * 1000);
  const randomTime = fiveMinutesAgo.getTime() + Math.random() * (now.getTime() - fiveMinutesAgo.getTime());
  return new Date(randomTime).toISOString();
}

function generateMockVotes(count) {
  const mockVotes = new Map();
  const mockVoterInfo = new Map();

  for (let i = 0; i < count; i++) {
    const country = weightedRandom(Object.entries(countries).map(([code, data]) => ({ code, weight: data.weight })));
    const browser = weightedRandom(browsers);
    const vote = weightedRandom(voteOptions);
    const countryData = countries[country.code];
    const timestamp = generateTimestamp();
    
    const verificationCode = Math.random().toString(36).substring(2, 15);
    
    // Randomly determine if this vote is from an iPhone (about 20% chance)
    const isIphone = Math.random() < 0.2;
    
    // Generate user agent - if isIphone, use an iPhone user agent
    let userAgent;
    if (isIphone) {
      // iPhone user agent examples
      const iphoneVersions = ['15_6', '16_0', '16_5', '17_0'];
      const safariVersions = ['605.1.15', '605.1.15', '605.1.15'];
      const iosVersion = iphoneVersions[Math.floor(Math.random() * iphoneVersions.length)];
      const safariVersion = safariVersions[Math.floor(Math.random() * safariVersions.length)];
      userAgent = `Mozilla/5.0 (iPhone; CPU iPhone OS ${iosVersion} like Mac OS X) AppleWebKit/${safariVersion} (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/${safariVersion}`;
    } else {
      userAgent = browser.format(browser.versions[Math.floor(Math.random() * browser.versions.length)]);
    }
    
    // Generate vote data
    const voteData = {
      electionId: election_settings.current_election,
      answers: { '0': vote.option },
      timestamp,
      isIphone
    };

    // Generate voter info
    const voterInfo = {
      ip: generateIP(country.code),
      userAgent,
      language: `${countryData.language},en;q=0.9`,
      isp: countryData.isps[Math.floor(Math.random() * countryData.isps.length)],
      country: country.code,
      timestamp,
      isIphone
    };

    mockVotes.set(verificationCode, voteData);
    mockVoterInfo.set(verificationCode, voterInfo);

    // Log the generated data
    console.log('Generated mock vote:', {
      verificationCode,
      vote: voteData,
      voterInfo
    });
  }

  return { votes: mockVotes, voterInfo: mockVoterInfo };
}

export { generateMockVotes };
