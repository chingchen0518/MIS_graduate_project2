let HOST_URL = import.meta.env.VITE_API_URL;
let NGROK_URL = import.meta.env.VITE_NGROK_URL;
const PORT = import.meta.env.PORT || 3001;
let BASE_URL = NGROK_URL || `http://${HOST_URL}:${PORT}`;

// StageModal.jsx
import './StageModal.css';

function StageModal({ nextStage, onClose }) {
  return (
    <div className="stage-modal-overlay">
      <div className="stage-modal-content">
        <h2>Entered the Next Stage!</h2>
        <p>Current Stage: {nextStage}</p>
        <button onClick={onClose}>Got it</button>
      </div>
    </div>
  );
}
export default StageModal;