import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./PlayTab.css";
import { getRandomPhoto, submitGuess } from "../api";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const NORTHWESTERN_CENTER = [42.0565, -87.6753];
const MAP_BOUNDS = [
  [42.044, -87.685],
  [42.065, -87.668],
];



function ClickableMarker({ selectedPosition, setSelectedPosition }) {
  useMapEvents({
    click(e) {
      setSelectedPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return selectedPosition ? <Marker position={selectedPosition} /> : null;
}

export default function PlayTab() {
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState("");
  const [photo, setPhoto] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(20);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [loadingPhoto, setLoadingPhoto] = useState(false);
  const [submittingGuess, setSubmittingGuess] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!isPlaying || secondsLeft <= 0) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, secondsLeft]);

  async function handlePlay() {
    if (!username.trim()) {
      setMessage("Please enter your username first.");
      return;
    }

    if (!userId.trim()) {
      setMessage("Please enter your user ID first.");
      return;
    }

    setMessage("");
    setResult(null);
    setSelectedPosition(null);
    setLoadingPhoto(true);

    try {
      const data = await getRandomPhoto();
      setPhoto(data.photo);
      setSecondsLeft(20);
      setIsPlaying(true);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoadingPhoto(false);
    }
  }

  async function handleSubmitGuess() {
    if (!photo) {
      setMessage("No photo loaded.");
      return;
    }

    if (!selectedPosition) {
      setMessage("Please place a pin on the map first.");
      return;
    }

    setMessage("");
    setSubmittingGuess(true);

    try {
      const payload = {
        user_id: Number(userId),
        username,
        photo_id: photo.id,
        guessed_lat: selectedPosition[0],
        guessed_lng: selectedPosition[1],
      };

      const data = await submitGuess(payload);
      setResult(data.result);
      setIsPlaying(false);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSubmittingGuess(false);
    }
  }

  function handleReset() {
    setPhoto(null);
    setSecondsLeft(20);
    setIsPlaying(false);
    setSelectedPosition(null);
    setResult(null);
    setMessage("");
  }

  return (
    <div className="play-tab">
      <div className="play-controls">
        <div className="input-group">
          <label>Username</label>
          <input
            type="text"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="input-group">
          <label>User ID</label>
          <input
            type="number"
            placeholder="Enter user ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
        </div>

        <button className="primary-btn" onClick={handlePlay} disabled={loadingPhoto}>
          {loadingPhoto ? "Loading..." : "Play"}
        </button>

        <button className="secondary-btn" onClick={handleReset}>
          Reset
        </button>
      </div>

      {message && <p className="play-message">{message}</p>}

      <div className="play-status">
        <div>
          <span className="status-label">Timer:</span> {secondsLeft}s
        </div>
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
              <img
                src={photo.s3_url || photo.image_url}
                alt={photo.caption || "Campus photo"}
                className="game-photo"
              />
              <p className="photo-caption">{photo.caption || "No caption"}</p>
            </>
          ) : (
            <div className="photo-placeholder">Click Play to start a round.</div>
          )}
        </div>

        <div className="map-panel">
          <h3>Map</h3>

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
              />
            </MapContainer>
          </div>

          <div className="pin-info">
            {selectedPosition ? (
              <>
                <p>
                  <strong>Selected Pin:</strong>
                </p>
                <p>Lat: {selectedPosition[0].toFixed(6)}</p>
                <p>Lng: {selectedPosition[1].toFixed(6)}</p>
              </>
            ) : (
              <p>Click on the map to place your pin.</p>
            )}
          </div>

          <button
            className="primary-btn submit-btn"
            onClick={handleSubmitGuess}
            disabled={!isPlaying || secondsLeft <= 0 || submittingGuess}
          >
            {submittingGuess ? "Submitting..." : "Submit Guess"}
          </button>
        </div>
      </div>

      {result && (
        <div className="result-box">
          <h3>Result</h3>
          <p>
            <strong>Score:</strong> {result.score}
          </p>
          <p>
            <strong>Distance:</strong> {Math.round(result.distance_meters)} meters
          </p>
          <p>
            <strong>Your Guess:</strong> ({result.guessed_lat.toFixed(6)},{" "}
            {result.guessed_lng.toFixed(6)})
          </p>
          <p>
            <strong>Actual Location:</strong> ({result.actual_lat.toFixed(6)},{" "}
            {result.actual_lng.toFixed(6)})
          </p>
        </div>
      )}
    </div>
  );
}