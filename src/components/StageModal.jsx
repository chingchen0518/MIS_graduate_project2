// StageModal.jsx
import './StageModal.css';

function StageModal({ nextStage, onClose }) {
  return (
    <div className="stage-modal-overlay">
      <div className="stage-modal-content">
        <h2>進入下一階段！</h2>
        <p>即將進入：{nextStage}</p>
        <button onClick={onClose}>確定</button>
      </div>
    </div>
  );
}
export default StageModal;