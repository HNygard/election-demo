const sessions = new Map();

function login(req, res) {
  const { username, password } = req.body;

  if (username === 'user' && password === 'password') {
    const sessionId = Math.random().toString(36).substring(2);
    sessions.set(sessionId, { username });
    res.json({ success: true, sessionId });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
}

function authenticate(req, res, next) {
  const sessionId = req.headers['x-session-id'];

  if (sessions.has(sessionId)) {
    req.user = sessions.get(sessionId);
    next();
  } else {
    res.status(401).json({ success: false, message: 'Unauthorized' });
  }
}

export { login, authenticate };
