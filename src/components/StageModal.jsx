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