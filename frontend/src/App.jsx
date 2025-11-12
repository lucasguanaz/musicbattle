import React, { useEffect, useState, useRef } from 'react';
import MatchPlayer from './components/MatchPlayer';
import './styles.css';

const CLIENT_ID = '76dc21b41e364b43a700154043882fb9';
const FRONTEND_URL = window.location.origin;

export default function App() {
  const [accessToken, setAccessToken] = useState(localStorage.getItem('spotify_access_token') || null);
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('spotify_refresh_token') || null);
  const [expiresAt, setExpiresAt] = useState(localStorage.getItem('spotify_expires_at') || null);
  const [connected, setConnected] = useState(false);
  const [deviceId, setDeviceId] = useState(null);
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [matches, setMatches] = useState([]);

  // handle tokens passed as query from backend
  useEffect(()=>{
    const params = new URLSearchParams(window.location.search);
    const at = params.get('access_token');
    const rt = params.get('refresh_token');
    const exp = params.get('expires_in');
    if (at) {
      const expiresAt = Date.now() + parseInt(exp,10)*1000;
      localStorage.setItem('spotify_access_token', at);
      localStorage.setItem('spotify_expires_at', expiresAt);
      if (rt) localStorage.setItem('spotify_refresh_token', rt);
      setAccessToken(at); setRefreshToken(rt); setExpiresAt(expiresAt);
      window.history.replaceState({}, document.title, '/');
    }
  },[]);

  // init Spotify Web Playback SDK when we have token
  useEffect(()=>{
    if (!accessToken) return;
    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new window.Spotify.Player({
        name: 'MUSIC BATTLE Player',
        getOAuthToken: cb => { cb(accessToken); },
        volume: 0.5
      });
      player.addListener('ready', ({ device_id }) => {
        console.log('Ready with Device ID', device_id);
        setDeviceId(device_id);
        setConnected(true);
      });
      player.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline', device_id);
        setConnected(false);
      });
      player.addListener('initialization_error', ({message}) => console.error(message));
      player.addListener('authentication_error', ({message}) => console.error('Auth error', message));
      player.connect();
    };
  }, [accessToken]);

  async function startLogin() {
    // redirect to backend to begin auth flow
    window.location.href = `${process.env.VITE_API_BASE || 'http://localhost:3000'}/auth/login`;
  }

  // create tournament (calls backend playlist endpoint and builds simple bracket)
  async function createTournament(e) {
    e?.preventDefault();
    const m = playlistUrl.match(/playlist\/([a-zA-Z0-9-_]+)(\?|$)/);
    if (!m) return alert('Playlist inválida');
    const playlistId = m[1];
    const base = process.env.VITE_API_BASE || 'http://localhost:3000';
    const res = await fetch(`${base}/playlist/${playlistId}`);
    const data = await res.json();
    if (!data.tracks || data.tracks.length === 0) return alert('Nenhuma faixa encontrada');
    // shuffle and make pairs
    const tracks = data.tracks.sort(()=>Math.random()-0.5);
    const pairs = [];
    for (let i=0;i<tracks.length;i+=2){
      if (i+1 < tracks.length) pairs.push({ id: Math.random().toString(36).slice(2,9), a: tracks[i], b: tracks[i+1], winner:null });
      else pairs.push({ id: Math.random().toString(36).slice(2,9), a: tracks[i], b:null, winner: tracks[i].id });
    }
    setMatches(pairs);
  }

  async function playUri(uri) {
    if (!deviceId) return alert('Conecte seu player: abra o Spotify (desktop ou mobile) e selecione o device "MUSIC BATTLE Player" nas configurações de dispositivo do Spotify.');
    const base = process.env.VITE_API_BASE || 'http://localhost:3000';
    const token = accessToken;
    // play using Web API using user's token and device id
    const r = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ uris: [uri] })
    });
    if (r.status === 204) return true;
    const j = await r.text();
    console.error('Play error', r.status, j);
    return false;
  }

  return (
    <div className="container">
      <header><h1>MUSIC BATTLE</h1></header>
      <div style={{marginBottom:12}}>
        {accessToken ? (
          <div>Conectado ao Spotify. Player: {connected ? 'ativo' : 'aguardando'}</div>
        ) : (
          <button onClick={startLogin} style={{background:'#1DB954', color:'#fff', padding:'10px 14px', borderRadius:8}}>Entrar com Spotify (Premium necessário)</button>
        )}
      </div>

      <form onSubmit={createTournament} className="form">
        <input placeholder="Cole o link da playlist do Spotify" value={playlistUrl} onChange={e=>setPlaylistUrl(e.target.value)} />
        <button>Criar torneio</button>
      </form>

      <div style={{marginTop:20}}>
        {matches.length === 0 ? <div>Sem disputas criadas</div> : (
          <div>
            {matches.map(m=>(
              <div key={m.id} style={{display:'flex',gap:20,marginBottom:18}}>
                <div style={{flex:1,textAlign:'center'}}>
                  <img src={m.a.album_image} width={160} alt="" />
                  <div>{m.a.name}</div>
                  <div style={{color:'#aaa'}}>{m.a.artists}</div>
                  <div style={{marginTop:8}}>
                    <button onClick={()=>playUri(m.a.uri)}>Tocar completa</button>
                  </div>
                </div>
                {m.b ? (
                  <div style={{flex:1,textAlign:'center'}}>
                    <img src={m.b.album_image} width={160} alt="" />
                    <div>{m.b.name}</div>
                    <div style={{color:'#aaa'}}>{m.b.artists}</div>
                    <div style={{marginTop:8}}>
                      <button onClick={()=>playUri(m.b.uri)}>Tocar completa</button>
                    </div>
                  </div>
                ) : <div>Advances (bye)</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
