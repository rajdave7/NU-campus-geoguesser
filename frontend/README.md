# Northwestern GeoGuessr

A Northwestern-themed GeoGuessr-style web app where players guess the location of campus photos.

Users can:
- Play the guessing game
- Upload photos of Northwestern campus locations
- View the leaderboard of top players

The frontend is built with **React + Vite** and connects to backend APIs (to be wired through API Gateway + Lambda).

---

# Project Structure

```
NU-campus-geoguesser
│
├─ frontend
│  ├─ src
│  │  ├─ assets
│  │  │  ├─ campus-photo.webp
│  │  │  ├─ nu-wildcats-logo.png
│  │  │  └─ wildcat-nu.png
│  │  │
│  │  ├─ components
│  │  │  ├─ PlayTab.jsx
│  │  │  ├─ UploadTab.jsx
│  │  │  └─ LeaderboardTab.jsx
│  │  │
│  │  ├─ api.js
│  │  ├─ App.jsx
│  │  └─ main.jsx
│  │
│  ├─ package.json
│  └─ vite.config.js
```

---

# Running the Frontend

### 1. Navigate to the frontend folder

```
cd frontend
```

### 2. Install dependencies

```
npm install
```

### 3. Run the development server

```
npm run dev
```

Vite will start the dev server.

Open the app at:

```
http://localhost:5173
```

---

# Application Overview

The UI contains **three main tabs**.

---

# Play Tab

Users can:

1. Enter **username** and **user ID**
2. Click **Play**
3. A **random campus photo** is shown
4. A **20 second timer** starts
5. The user places a pin on the map
6. The guess is submitted to the backend

The backend returns:

- actual location
- distance from guess
- score

---

# Upload Tab

Users can submit photos to be featured in the game.

Required fields:

- Photo file
- Latitude
- Longitude

Optional:

- Caption
- User ID

The frontend currently converts the image to **base64** before sending it to the upload endpoint.

Expected endpoint:

```
POST /photos/upload
```

Example payload:

```json
{
  "user_id": 1,
  "caption": "Lakefill sunset",
  "latitude": 42.056,
  "longitude": -87.675,
  "image_base64": "...",
  "file_name": "lakefill.jpg"
}
```

---

# Leaderboard Tab

Displays top players ranked by **total score**.

Top 3 players receive:

- 🥇 Gold
- 🥈 Silver
- 🥉 Bronze

Expected endpoint:

```
GET /leaderboard
```

Example response:

```json
{
  "leaderboard": [
    {
      "rank": 1,
      "user_id": 1,
      "username": "alex",
      "total_score": 18240
    },
    {
      "rank": 2,
      "user_id": 2,
      "username": "saket",
      "total_score": 17650
    }
  ]
}
```

---

# API Integration

All frontend API calls are centralized in:

```
src/api.js
```

Current functions:

| Function | Endpoint |
|--------|--------|
| getRandomPhoto | `/game/photo` |
| submitGuess | `/game/guess` |
| getLeaderboard | `/leaderboard` |
| uploadPhoto | `/photos/upload` |

Base API URL:

```
http://localhost:4000
```

This can be changed inside:

```
src/api.js
```

---

# Mock Mode

The frontend supports **mock mode** so the UI can run without the backend.

Inside `src/api.js`:

```
const USE_MOCK = true
```

When enabled:
- No backend calls are made
- Mock data is returned instead

To use the real backend:

```
const USE_MOCK = false
```

---

# Expected Backend Endpoints

### Random Photo

```
GET /game/photo
```

Response:

```json
{
  "photo": {
    "id": "uuid",
    "s3_url": "https://bucket.s3.amazonaws.com/photo.jpg"
  }
}
```

---

### Submit Guess

```
POST /game/guess
```

Payload:

```json
{
  "user_id": 1,
  "photo_id": "uuid",
  "guessed_lat": 42.056,
  "guessed_lng": -87.675
}
```

Response:

```json
{
  "result": {
    "distance_meters": 120,
    "score": 4380
  }
}
```

---

### Upload Photo

```
POST /photos/upload
```

Payload includes:

- base64 encoded image
- coordinates
- optional caption
- optional user id

---

### Leaderboard

```
GET /leaderboard
```

Returns top players sorted by score.

---

# Notes

- Frontend styling follows Northwestern branding colors.
- Images are stored in `src/assets`.
- All API logic is centralized in `api.js` so backend wiring can be done without modifying UI components.

---

# Future Improvements

Possible extensions:

- Photo moderation / approval system
- Multiple rounds per game
- User authentication
- Mobile optimization
- Better map interaction
- Admin panel for approving photos

---

# Authors

Northwestern CS project.