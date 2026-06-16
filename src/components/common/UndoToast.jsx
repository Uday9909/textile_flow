// ============================================================
// UndoToast — 30-second countdown undo action
// ============================================================

import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle, Undo2 } from 'lucide-react';

export default function UndoToast() {
  const { state, dispatch } = useApp();
  const [remaining, setRemaining] = useState(30);

  const undoAction = state.undoAction;

  useEffect(() => {
    if (!undoAction) return;
    const update = () => {
      const secs = Math.max(0, Math.ceil((undoAction.expiresAt - Date.now()) / 1000));
      setRemaining(secs);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [undoAction]);

  if (!undoAction) return null;

  const handleUndo = () => {
    dispatch({
      type: 'UNDO_COMPLETE',
      payload: undoAction.payload,
    });
  };

  const lot = (state.lots || []).find(l => l.id === undoAction.payload.lotId) || undoAction.payload.previousLot;

  return (
    <div className="undo-toast">
      <CheckCircle size={20} />
      <span>Lot {lot?.lotNumber} marked complete</span>
      <button className="undo-btn" onClick={handleUndo}>
        <Undo2 size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
        UNDO — {remaining}s
      </button>
    </div>
  );
}
