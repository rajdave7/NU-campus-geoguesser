import { useState } from "react";
import { uploadPhoto } from "../api";
import "./UploadTab.css";

export default function UploadTab() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [base64Image, setBase64Image] = useState("");
  const [caption, setCaption] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [userId, setUserId] = useState("");
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);

  function convertFileToBase64(selectedFile) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
    });
  }

  async function handleFileChange(e) {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setMessage("");
    try {
      const encoded = await convertFileToBase64(selectedFile);
      setBase64Image(encoded);
    } catch {
      setMessage("Failed to process selected image.");
    }
  }

  function handleGetLocation() {
  if (!navigator.geolocation) {
    setMessage("Geolocation is not supported by your browser.");
    return;
  }
  setLocating(true);
  setMessage("");
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      setLatitude(pos.coords.latitude.toFixed(7));
      setLongitude(pos.coords.longitude.toFixed(7));
      setLocating(false);
      setMessage("✓ Location detected successfully!");
    },
    (err) => {
      setLocating(false);
      if (err.code === 1) {
        setLocationDenied(true); // show the help UI
      } else if (err.code === 2) {
        setMessage("Location unavailable. Please enter coordinates manually.");
      } else if (err.code === 3) {
        setMessage("Location request timed out. Please try again.");
      }
    },
    { timeout: 10000, enableHighAccuracy: true }
  );
}

  async function handleUpload() {
    if (!file || !base64Image) { setMessage("Please select a photo first."); return; }
    if (!latitude || !longitude) { setMessage("Please enter or detect your location."); return; }
    setUploading(true);
    setMessage("");
    try {
      const data = await uploadPhoto({
        user_id: userId ? Number(userId) : null,
        caption,
        latitude: Number(latitude),
        longitude: Number(longitude),
        image_base64: base64Image,
        file_name: file.name,
      });
      setMessage(data.message || "Photo uploaded successfully.");
    } catch (err) {
      setMessage(err.message || "Failed to upload photo.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="upload-tab">
      <div className="upload-banner">
        <div className="upload-banner-content">
          <p className="upload-tag">Northwestern Campus Spotlight</p>
          <h2>Send us your favorite spot on campus.</h2>
          <p className="upload-subtext">Share a photo you love and we may feature it in the game for everyone to guess.</p>
        </div>
      </div>

      <div className="upload-card">
        <div className="upload-form-grid">
          <div className="upload-left">
            <label className="upload-label">Select Photo</label>
            <input type="file" accept="image/*" onChange={handleFileChange} className="upload-file-input" />

            <label className="upload-label">Caption</label>
            <input type="text" placeholder="Optional caption" value={caption}
              onChange={(e) => setCaption(e.target.value)} className="upload-input" />

            <label className="upload-label">User ID (optional)</label>
            <input type="number" placeholder="Enter user ID" value={userId}
              onChange={(e) => setUserId(e.target.value)} className="upload-input" />

            <label className="upload-label">Location</label>
            <button onClick={handleGetLocation} disabled={locating} className="secondary-btn location-btn">
              {locating ? "Detecting..." : "Use My Current Location"}
            </button>


            {locationDenied && (
  <div className="location-denied-box">
    <p className="location-denied-title">📍 Location access is blocked</p>
    <p>To allow location access, follow the steps for your browser:</p>
    <div className="location-steps">
      <div className="location-step">
        <strong>Chrome:</strong> Click the lock icon 🔒 in the address bar → click "Location" → select "Allow" → refresh the page
      </div>
      <div className="location-step">
        <strong>Firefox:</strong> Click the lock icon 🔒 → click "Connection secure" → "More information" → "Permissions" → unblock Location
      </div>
      <div className="location-step">
        <strong>Safari:</strong> Go to Settings → Safari → Location → Allow
      </div>
      <div className="location-step">
        <strong>Edge:</strong> Click the lock icon 🔒 → "Permissions for this site" → Location → Allow
      </div>
    </div>
    <p className="location-denied-alt">Or just type your coordinates manually in the fields below.</p>
    <button className="secondary-btn" onClick={() => { setLocationDenied(false); handleGetLocation(); }}>
      Try Again After Enabling
    </button>
  </div>
)}


            <div className="upload-coords">
              <div>
                <label className="upload-label">Latitude</label>
                <input type="number" step="any" placeholder="42.0561" value={latitude}
                  onChange={(e) => setLatitude(e.target.value)} className="upload-input" />
              </div>
              <div>
                <label className="upload-label">Longitude</label>
                <input type="number" step="any" placeholder="-87.6750" value={longitude}
                  onChange={(e) => setLongitude(e.target.value)} className="upload-input" />
              </div>
            </div>

            <button onClick={handleUpload} disabled={uploading} className="upload-button">
              {uploading ? "Uploading..." : "Upload Photo"}
            </button>

            {message && <p className="upload-message">{message}</p>}
          </div>

          <div className="upload-right">
            <div className="upload-preview-box">
              {previewUrl ? (
                <img src={previewUrl} alt="Upload preview" className="upload-preview-image" />
              ) : (
                <div className="upload-preview-placeholder">Your selected image preview will appear here.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}