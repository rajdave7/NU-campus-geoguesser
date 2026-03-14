import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./PlayTab.css";
import { createUser, getRandomPhoto, submitGuess } from "../api";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Green marker for actual location
const actualIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Red marker for user guess
const guessIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const NORTHWESTERN_CENTER = [42.0565, -87.6753];
const MAP_BOUNDS = [[42.044, -87.685], [42.065, -87.668]];

function ClickableMarker({ selectedPosition, setSelectedPosition, isPlaying }) {
  useMapEvents({
    click(e) {
      if (isPlaying) setSelectedPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return selectedPosition
    ? <Marker position={selectedPosition} icon={guessIcon} />
    : null;
}

export default function PlayTab({ user, setUser }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [photo, setPhoto] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [actualPosition, setActualPosition] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState(null);
  const [usedPhotoIds, setUsedPhotoIds] = useState([]);

  useEffect(() => {
    if (!isPlaying || secondsLeft <= 0) return;
    const timer = setInterval(() => setSecondsLeft((p) => p - 1), 1000);
    return () => clearInterval(timer);
  }, [isPlaying, secondsLeft]);

  async function handleJoin() {
    if (!username.trim() || !email.trim()) {
      setMessage("Please enter both username and email.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const data = await createUser(username.trim(), email.trim());
      setUser(data.user);
      setMessage(`Welcome, ${data.user.username}! Your current score: ${data.user.score}`);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePlay() {
    if (!user) { setMessage("Please join first."); return; }
    setMessage("");
    setResult(null);
    setSelectedPosition(null);
    setActualPosition(null);
    setLoading(true);
    try {
      const data = await getRandomPhoto(usedPhotoIds);
      if (data.reset) setUsedPhotoIds([]);
      setPhoto(data.photo);
      setUsedPhotoIds((prev) => [...prev, data.photo.id]);
      setSecondsLeft(60);
      setIsPlaying(true);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitGuess() {
    if (!photo) { setMessage("No photo loaded."); return; }
    if (!selectedPosition) { setMessage("Please place a pin on the map first."); return; }
    setSubmitting(true);
    setMessage("");
    try {
      const data = await submitGuess({
        user_id: user.id,
        photo_id: photo.id,
        guessed_lat: selectedPosition[0],
        guessed_lng: selectedPosition[1],
      });
      setResult(data.result);
      setActualPosition([data.result.actual_lat, data.result.actual_lng]);
      setUser((u) => ({ ...u, score: u.score + data.result.score }));
      setIsPlaying(false);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    setPhoto(null);
    setSecondsLeft(60);
    setIsPlaying(false);
    setSelectedPosition(null);
    setActualPosition(null);
    setResult(null);
    setMessage("");
  }

  return (
    <div className="play-tab">
      {!user ? (
        <div className="play-controls">
          <div className="input-group">
            <label>Username</label>
            <input type="text" placeholder="Enter username" value={username}
              onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div className="input-group">
            <label>Email</label>
            <input type="email" placeholder="Enter email" value={email}
              onChange={(e) => setEmail(e.target.value)} />
          </div>
          <button className="primary-btn" onClick={handleJoin} disabled={loading}>
            {loading ? "Joining..." : "Join"}
          </button>
          {message && <p className="play-message">{message}</p>}
        </div>
      ) : (
        <>
          <div className="play-controls">
            <p className="player-info">
              Playing as <strong>{user.username}</strong> — Score: <strong>{user.score}</strong>
            </p>
            <button className="primary-btn" onClick={handlePlay} disabled={loading || isPlaying}>
              {loading ? "Loading..." : isPlaying ? "Round Active" : "Play"}
            </button>
            <button className="secondary-btn" onClick={handleReset}>Reset</button>
          </div>

          {message && <p className="play-message">{message}</p>}

          <div className="play-status">
            <div><span className="status-label">Timer:</span> {secondsLeft}s</div>
            <div>
              <span className="status-label">Status:</span>{" "}
              {isPlaying ? (secondsLeft > 0 ? "Round Active" : "Time Expired") : "Idle"}
            </div>
          </div>

          <div className="play-layout">
            <div className="photo-panel">
              <h3>Photo</h3>
              {photo ? (
                <>
                  <img src={photo.s3_url} alt={photo.caption || "Campus photo"} className="game-photo" />
                  <p className="photo-caption">{photo.caption || "No caption"}</p>
                </>
              ) : (
                <div className="photo-placeholder">Click Play to start a round.</div>
              )}
            </div>

            <div className="map-panel">
              <h3>
                Map
                {result && (
                  <span className="map-legend">
                    <span className="legend-guess">● Your guess</span>
                    <span className="legend-actual">● Actual location</span>
                  </span>
                )}
              </h3>

              <div className="map-wrapper">
                <MapContainer
                  center={NORTHWESTERN_CENTER}
                  zoom={16}
                  minZoom={15}
                  maxZoom={18}
                  maxBounds={MAP_BOUNDS}
                  maxBoundsViscosity={1.0}
                  className="leaflet-map"
                >
                  <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <ClickableMarker
                    selectedPosition={selectedPosition}
                    setSelectedPosition={setSelectedPosition}
                    isPlaying={isPlaying}
                  />
                  {/* Show actual location pin after guess */}
                  {actualPosition && (
                    <Marker position={actualPosition} icon={actualIcon} />
                  )}
                  {/* Draw line between guess and actual */}
                  {selectedPosition && actualPosition && (
                    <Polyline
                      positions={[selectedPosition, actualPosition]}
                      pathOptions={{ color: "#6366f1", weight: 2, dashArray: "6 4" }}
                    />
                  )}
                </MapContainer>
              </div>

              <div className="pin-info">
                {selectedPosition ? (
                  <>
                    <p><strong>Your pin:</strong> {selectedPosition[0].toFixed(5)}, {selectedPosition[1].toFixed(5)}</p>
                    {actualPosition && (
                      <p><strong>Actual:</strong> {actualPosition[0].toFixed(5)}, {actualPosition[1].toFixed(5)}</p>
                    )}
                  </>
                ) : (
                  <p>{isPlaying ? "Click on the map to place your pin." : "Start a round to play."}</p>
                )}
              </div>

              <button
                className="primary-btn submit-btn"
                onClick={handleSubmitGuess}
                disabled={!isPlaying || secondsLeft <= 0 || submitting}
              >
                {submitting ? "Submitting..." : "Submit Guess"}
              </button>
            </div>
          </div>

          {result && (
            <div className="result-box">
              <h3>Result</h3>
              <p><strong>Score:</strong> {result.score} pts</p>
              <p><strong>Distance:</strong> {Math.round(result.distance_meters)} meters away</p>
              <p><strong>Your guess:</strong> ({result.guessed_lat.toFixed(5)}, {result.guessed_lng.toFixed(5)})</p>
              <p><strong>Actual location:</strong> ({result.actual_lat.toFixed(5)}, {result.actual_lng.toFixed(5)})</p>
              <button className="primary-btn" onClick={handlePlay} style={{ marginTop: "12px" }}>
                Play Next Round
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}