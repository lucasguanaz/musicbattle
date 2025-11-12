MUSIC BATTLE - Advanced (Web Playback SDK + OAuth)

Instructions (summary):

1) Backend (Render or any Node host)
   - Copy backend/.env.example -> .env and fill SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET and FRONTEND_URL (ex: https://musicbattle.vercel.app)
   - npm install
   - npm start
   - Exposed endpoints:
     - GET /auth/login -> redirects to Spotify authorize
     - GET /auth/callback -> exchanges code and redirects to frontend with tokens
     - POST /auth/refresh -> refresh token (body: { refresh_token })
     - GET /playlist/:id -> fetch playlist tracks (client credentials)

2) Frontend (Vercel)
   - In Vercel, set environment variable VITE_API_BASE to your backend URL (ex: https://musicbattle-backend.onrender.com)
   - Deploy frontend folder (Vite + React)
   - The app will redirect to backend /auth/login to start OAuth; after user authorizes, backend redirects back with access_token in query
   - The app initializes Spotify Web Playback SDK to create a "MUSIC BATTLE Player". The user must then open their Spotify app (desktop/mobile) and select that device to hear playback, or the SDK will play directly in browser for supported environments and premium users.

Notes:
- The user must have Spotify Premium for full-track playback via the Web Playback SDK.
- For production, secure your client secret and use HTTPS redirect URIs that match exactly those in your Spotify Dashboard.
