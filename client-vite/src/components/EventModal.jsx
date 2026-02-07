import React from 'react';
import './EventModal.css';

const EventModal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="event-modal-overlay" onClick={onClose}>
      <div className="event-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>×</button>
        {children}
      </div>
    </div>
  );
};

export default EventModal;
