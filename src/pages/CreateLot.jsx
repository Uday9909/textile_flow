// ============================================================
// Create Lot — New lot entry form with workflow selection
// ============================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  WORKFLOW_TEMPLATES, FABRIC_TYPES, PARTIES, STAGE_POOL,
  generateId, generateLotNumber, getStageById,
} from '../data/mockData';
import CustomWorkflowBuilder from '../components/CreateLot/CustomWorkflowBuilder';
import ChallanScanner from '../components/CreateLot/ChallanScanner';
import { notifyLotArrival } from '../api';
import { Plus, Package, ArrowRight, Layers, Palette, Weight, Building2, Scan } from 'lucide-react';

export default function CreateLot() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    partyName: '',
    lotNumber: generateLotNumber(),
    quantity: '',
    fabricType: '',
    colour: '',
    priority: 'normal',
  });

  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [customStages, setCustomStages] = useState(null);
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [errors, setErrors] = useState({});

  const handleScanComplete = (data) => {
    if (data.partyName) handleChange('partyName', data.partyName.trim());
    if (data.quantity) handleChange('quantity', data.quantity);
    if (data.lotNumber) handleChange('lotNumber', data.lotNumber);
    if (data.colour) handleChange('colour', data.colour.trim());
    setShowScanner(false);
  };

  const allWorkflows = [...state.workflows, ...(customStages ? [{
    id: 'custom_' + Date.now(),
    name: 'Custom Workflow',
    description: 'Your custom workflow',
    stages: customStages,
  }] : [])];

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.partyName.trim()) newErrors.partyName = 'Party name is required';
    if (!formData.lotNumber.trim()) newErrors.lotNumber = 'Lot number is required';
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) newErrors.quantity = 'Valid quantity is required';
    if (!formData.fabricType) newErrors.fabricType = 'Select a fabric type';
    if (!formData.colour.trim()) newErrors.colour = 'Colour is required';
    if (!selectedWorkflow && !customStages) newErrors.workflow = 'Select a workflow template';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const workflow = selectedWorkflow
      ? allWorkflows.find(w => w.id === selectedWorkflow)
      : { stages: customStages };
    if (!workflow) return;

    const lot = {
      id: generateId(),
      lotNumber: formData.lotNumber,
      partyName: formData.partyName,
      quantity: parseFloat(formData.quantity),
      fabricType: formData.fabricType,
      colour: formData.colour,
      priority: formData.priority,
      workflowId: selectedWorkflow || 'custom',
      stages: workflow.stages,
      currentStageIndex: 0,
      status: 'waiting',
      stageHistory: [{
        stageId: workflow.stages[0],
        status: 'waiting',
        startTime: null,
        endTime: null,
        operator: null,
        waitingSince: new Date().toISOString(),
      }],
      createdAt: new Date().toISOString(),
    };

    dispatch({ type: 'CREATE_LOT', payload: { lot } });

    // Fire-and-forget WhatsApp arrival notification
    notifyLotArrival({
      lotNumber: lot.lotNumber,
      partyName: lot.partyName,
      quantity: lot.quantity,
      fabricType: lot.fabricType,
    }).catch(() => {});

    navigate(`/queue/${workflow.stages[0]}`);
  };

  const handleCustomWorkflowSave = (stages) => {
    setCustomStages(stages);
    setSelectedWorkflow(null);
    setShowCustomBuilder(false);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>
          <Package size={36} style={{ verticalAlign: 'middle', marginRight: '12px' }} />
          New Job
        </h1>
        <p>Enter lot details and select a workflow to begin processing</p>
        <button className="btn btn-secondary" onClick={() => setShowScanner(true)} style={{ marginTop: 'var(--space-2)' }}>
          <Scan size={16} /> Scan Challan
        </button>
      </div>

      {showScanner && (
        <ChallanScanner onScanComplete={handleScanComplete} onClose={() => setShowScanner(false)} />
      )}

      {/* Form */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-5)', marginBottom: 'var(--space-8)' }}>
        {/* Party Name */}
        <div className="form-group">
          <label className="form-label">
            <Building2 size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
            Party Name
          </label>
          <input
            className="form-input"
            type="text"
            placeholder="Type or select a party"
            value={formData.partyName}
            onChange={e => handleChange('partyName', e.target.value)}
            list="party-suggestions"
          />
          <datalist id="party-suggestions">
            {PARTIES.map(p => <option key={p} value={p} />)}
          </datalist>
          {errors.partyName && <span style={{ color: 'var(--priority-urgent)', fontSize: 'var(--font-size-sm)' }}>{errors.partyName}</span>}
        </div>

        {/* Lot Number */}
        <div className="form-group">
          <label className="form-label">
            <Layers size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
            Lot Number
          </label>
          <input
            className="form-input"
            type="text"
            placeholder="e.g., 21112"
            value={formData.lotNumber}
            onChange={e => handleChange('lotNumber', e.target.value)}
          />
          {errors.lotNumber && <span style={{ color: 'var(--priority-urgent)', fontSize: 'var(--font-size-sm)' }}>{errors.lotNumber}</span>}
        </div>

        {/* Quantity */}
        <div className="form-group">
          <label className="form-label">
            <Weight size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
            Quantity (kg)
          </label>
          <input
            className="form-input"
            type="number"
            step="0.01"
            min="0"
            placeholder="e.g., 293.25"
            value={formData.quantity}
            onChange={e => handleChange('quantity', e.target.value)}
          />
          {errors.quantity && <span style={{ color: 'var(--priority-urgent)', fontSize: 'var(--font-size-sm)' }}>{errors.quantity}</span>}
        </div>

        {/* Fabric Type */}
        <div className="form-group">
          <label className="form-label">Fabric Type</label>
          <select
            className="form-select"
            value={formData.fabricType}
            onChange={e => handleChange('fabricType', e.target.value)}
          >
            <option value="">Select Fabric Type</option>
            {FABRIC_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          {errors.fabricType && <span style={{ color: 'var(--priority-urgent)', fontSize: 'var(--font-size-sm)' }}>{errors.fabricType}</span>}
        </div>

        {/* Colour */}
        <div className="form-group">
          <label className="form-label">
            <Palette size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
            Colour
          </label>
          <input
            className="form-input"
            type="text"
            placeholder="e.g., Navy Blue"
            value={formData.colour}
            onChange={e => handleChange('colour', e.target.value)}
          />
          {errors.colour && <span style={{ color: 'var(--priority-urgent)', fontSize: 'var(--font-size-sm)' }}>{errors.colour}</span>}
        </div>

        {/* Priority */}
        <div className="form-group">
          <label className="form-label">Priority</label>
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            {[
              { key: 'urgent', label: 'Urgent', bg: 'var(--priority-urgent-bg)', border: 'var(--priority-urgent-border)', color: 'var(--priority-urgent)' },
              { key: 'normal', label: 'Normal', bg: 'var(--priority-normal-bg)', border: 'var(--priority-normal-border)', color: 'var(--priority-normal)' },
              { key: 'low', label: 'Low', bg: 'var(--priority-low-bg)', border: 'var(--priority-low-border)', color: 'var(--priority-low)' },
            ].map(p => (
              <button
                key={p.key}
                onClick={() => handleChange('priority', p.key)}
                style={{
                  flex: 1,
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${formData.priority === p.key ? p.color : 'var(--border-subtle)'}`,
                  background: formData.priority === p.key ? p.bg : 'var(--bg-input)',
                  color: formData.priority === p.key ? p.color : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 'var(--font-size-sm)',
                  fontFamily: 'var(--font-family)',
                  minHeight: '48px',
                  transition: 'all var(--transition-fast)',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Workflow Selection */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h3 style={{ marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <ArrowRight size={20} />
          Select Workflow
        </h3>
        {errors.workflow && <span style={{ color: 'var(--priority-urgent)', fontSize: 'var(--font-size-sm)', display: 'block', marginBottom: 'var(--space-3)' }}>{errors.workflow}</span>}

        <div className="workflow-grid">
          {state.workflows.map(wf => (
            <div
              key={wf.id}
              className={`workflow-card ${selectedWorkflow === wf.id ? 'selected' : ''}`}
              onClick={() => { setSelectedWorkflow(wf.id); setCustomStages(null); }}
            >
              <div className="workflow-card-name">{wf.name}</div>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
                {wf.description}
              </p>
              <div className="stage-timeline">
                {wf.stages.map((stageId, idx) => {
                  const stage = getStageById(stageId);
                  return (
                    <span key={idx} style={{ display: 'contents' }}>
                      <span className="stage-pill pending">
                        {stage?.name}
                      </span>
                      {idx < wf.stages.length - 1 && <span className="stage-connector" />}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Custom Workflow Card */}
          {customStages ? (
            <div
              className={`workflow-card ${!selectedWorkflow ? 'selected' : ''}`}
              onClick={() => setSelectedWorkflow(null)}
            >
              <div className="workflow-card-name">Custom Workflow</div>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
                {customStages.length} stages
              </p>
              <div className="stage-timeline">
                {customStages.map((stageId, idx) => {
                  const stage = getStageById(stageId);
                  return (
                    <span key={idx} style={{ display: 'contents' }}>
                      <span className="stage-pill pending">
                        {stage?.name}
                      </span>
                      {idx < customStages.length - 1 && <span className="stage-connector" />}
                    </span>
                  );
                })}
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={e => { e.stopPropagation(); setShowCustomBuilder(true); }}
                style={{ marginTop: 'var(--space-3)' }}
              >
                Edit Workflow
              </button>
            </div>
          ) : (
            <div
              className="workflow-card"
              onClick={() => setShowCustomBuilder(true)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '180px', borderStyle: 'dashed' }}
            >
              <Plus size={32} style={{ color: 'var(--text-tertiary)', marginBottom: 'var(--space-3)' }} />
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Create Custom Workflow</span>
              <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-tertiary)' }}>Drag & drop stages</span>
            </div>
          )}
        </div>
      </div>

      {/* Submit */}
      <button className="btn btn-primary btn-xl btn-full" onClick={handleSubmit}>
        <Package size={24} />
        Create Lot & Start Workflow
      </button>

      {/* Custom Workflow Builder Modal */}
      {showCustomBuilder && (
        <CustomWorkflowBuilder
          initialStages={customStages || []}
          onSave={handleCustomWorkflowSave}
          onCancel={() => setShowCustomBuilder(false)}
        />
      )}
    </div>
  );
}
