// ============================================================
// ChallanScanner — AI-powered challan OCR scanner
// ============================================================
// Sends challan image to backend → Gemini AI → extracts fields
// Handles both printed and handwritten text.
// ============================================================

import { useState, useRef } from 'react';
import { Scan, X, Check, Loader } from 'lucide-react';
import { PARTIES } from '../../data/mockData';
import { api } from '../../api';

export default function ChallanScanner({ onScanComplete, onClose }) {
  const [image, setImage] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [extracted, setExtracted] = useState(null);
  const fileInputRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setImage(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleScan = async () => {
    if (!image) return;
    setScanning(true);
    setProgress(30);
    setExtracted(null);

    try {
      setProgress(60);

      const res = await api('/api/ocr/challan', {
        method: 'POST',
        body: JSON.stringify({ image }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'OCR failed' }));
        throw new Error(err.error || 'OCR request failed');
      }

      setProgress(90);

      const data = await res.json();

      // Fuzzy match party name against known parties
      const matchedParty = data.partyName ? findBestMatch(data.partyName, PARTIES) : '';

      const extractedData = {
        partyName: matchedParty || data.partyName || '',
        quantity: data.quantity || '',
        lotNumber: data.lotNumber || '',
        colour: data.colour || '',
        matched: !!matchedParty,
        originalRaw: data.partyName,
      };

      setProgress(100);
      setExtracted(extractedData);
    } catch (err) {
      console.error('OCR failed:', err);
      setExtracted({ error: err.message });
    } finally {
      setScanning(false);
    }
  };

  const applyResults = () => {
    if (extracted && !extracted.error) {
      onScanComplete({
        partyName: extracted.partyName || '',
        quantity: extracted.quantity || '',
        lotNumber: extracted.lotNumber || '',
        colour: extracted.colour || '',
      });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content challan-scanner" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Scan Challan</h2>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="scanner-body">
          {!image ? (
            <div className="scanner-upload">
              <div className="scanner-upload-icon">
                <Scan size={48} />
              </div>
              <p>Upload a challan document image</p>
              <div className="scanner-buttons">
                <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()}>
                  <Upload size={16} /> Choose File
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={(e) => handleFile(e.target.files[0])}
              />
            </div>
          ) : (
            <div className="scanner-preview">
              <img src={image} alt="Challan preview" className="scanner-img" />

              {!extracted && !scanning && (
                <button className="btn btn-primary" onClick={handleScan}>
                  <Scan size={16} /> Scan Document
                </button>
              )}

              {scanning && (
                <div className="scanner-progress">
                  <Loader size={24} className="spinner" />
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${progress}%` }} />
                  </div>
                  <span>{progress}% — recognizing text...</span>
                </div>
              )}

              {extracted && !extracted.error && (
                <div className="scanner-results">
                  <h3><Check size={18} /> Extracted Data</h3>
                  <div className="extracted-fields">
                    <div className="extracted-field">
                      <label>Party Name {extracted.matched && <span style={{ fontSize: 10, color: '#10b981', marginLeft: 4 }}>✓ Matched</span>}</label>
                      <span>{extracted.partyName || 'Not found'}</span>
                    </div>
                    <div className="extracted-field">
                      <label>Quantity</label>
                      <span>{extracted.quantity || 'Not found'}</span>
                    </div>
                    <div className="extracted-field">
                      <label>Lot Number</label>
                      <span>{extracted.lotNumber || 'Not found'}</span>
                    </div>
                    <div className="extracted-field">
                      <label>Colour</label>
                      <span>{extracted.colour || 'Not found'}</span>
                    </div>
                  </div>
                  <div className="scanner-actions">
                    <button className="btn btn-primary" onClick={applyResults}>
                      <Check size={16} /> Apply to Form
                    </button>
                    <button className="btn btn-secondary" onClick={() => { setImage(null); setExtracted(null); }}>
                      Scan Again
                    </button>
                  </div>
                </div>
              )}

              {extracted?.error && (
                <div className="scanner-error">
                  <p>OCR failed: {extracted.error}</p>
                  <button className="btn btn-secondary" onClick={() => { setImage(null); setExtracted(null); }}>
                    Try Again
                  </button>
                </div>
              )}

              {!extracted && !scanning && (
                <button className="btn btn-secondary" onClick={() => { setImage(null); setExtracted(null); }}>
                  <X size={16} /> Cancel
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Helper: fuzzy match against known parties ──
function findBestMatch(input, parties) {
  const clean = input.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  if (!clean) return '';

  let best = { name: '', score: 0 };

  for (const party of parties) {
    const pClean = party.toLowerCase().replace(/[^a-z0-9\s]/g, '');

    // Exact match
    if (pClean === clean) return party;

    // One contains the other
    if (pClean.includes(clean) || clean.includes(pClean)) {
      const score = Math.min(clean.length, pClean.length) / Math.max(clean.length, pClean.length);
      if (score > best.score) best = { name: party, score };
    }

    // Word overlap
    const cleanWords = clean.split(/\s+/);
    const pWords = pClean.split(/\s+/);
    const common = cleanWords.filter(w => w.length > 1 && pWords.includes(w)).length;
    const score = common / Math.max(cleanWords.length, pWords.length);
    if (score > best.score) best = { name: party, score };
  }

  return best.score >= 0.4 ? best.name : '';
}
