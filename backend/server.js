import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import cors from 'cors';
import bodyParser from 'body-parser';
import querystring from 'querystring';
dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env');
}

// Client credentials token (for read-only calls like fetching playlist tracks)
let clientToken = null;
let clientTokenExpires = 0;

async function getClientToken() {
  const now = Date.now();
  if (clientToken && now < clientTokenExpires) return clientToken;
  const resp = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  const j = await resp.json();
  clientToken = j.access_token;
  clientTokenExpires = now + (j.expires_in - 60) * 1000;
  return clientToken;
}

// Exchange code for tokens (Authorization Code flow)
app.get('/auth/login', (req, res) => {
  const scopes = [
    'streaming',
    'user-read-email',
    'user-read-private',
    'user-modify-playback-state',
    'user-read-playback-state'
  ].join(' ');
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    scope: scopes,
    redirect_uri: `${FRONTEND_URL}/callback`
  });
  res.redirect(`https://accounts.spotify.com/authorize?${params.toString()}`);
});

app.get('/auth/callback', async (req, res) => {
  const code = req.query.code || null;
  const body = new URLSearchParams({
    code,
    redirect_uri: `${FRONTEND_URL}/callback`,
    grant_type: 'authorization_code'
  });
  const resp = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: body.toString()
  });
  const data = await resp.json();
  // redirect back to frontend with tokens in query (frontend will pick them up)
  const params = new URLSearchParams({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in
  });
  res.redirect(`${FRONTEND_URL}/?${params.toString()}`);
});

// Refresh token
app.post('/auth/refresh', async (req, res) => {
  const { refresh_token } = req.body;
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token
  });
  const resp = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: body.toString()
  });
  const data = await resp.json();
  res.json(data);
});

// Fetch playlist tracks (using client credentials) - filters tracks without preview and returns track objects
app.get('/playlist/:id', async (req, res) => {
  try {
    const playlistId = req.params.id;
    const token = await getClientToken();
    const tracks = [];
    let url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`;
    while (url) {
      const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!r.ok) return res.status(r.status).json({ error: 'Spotify API error' });
      const j = await r.json();
      for (const item of j.items) {
        const t = item.track;
        if (!t) continue;
        tracks.push({
          id: t.id,
          name: t.name,
          artists: t.artists.map(a=>a.name).join(', '),
          uri: t.uri,
          preview_url: t.preview_url,
          album_image: t.album?.images?.[0]?.url ?? null,
          duration_ms: t.duration_ms
        });
      }
      url = j.next;
    }
    res.json({ tracks });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'internal' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log('Backend listening on', PORT));
