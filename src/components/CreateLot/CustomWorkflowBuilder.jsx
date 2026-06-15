// ============================================================
// CustomWorkflowBuilder — Drag & Drop stage builder
// ============================================================

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { STAGE_POOL, getStageById } from '../../data/mockData';
import { GripVertical, Plus, X, Save } from 'lucide-react';

function SortableStage({ id, stage, onRemove }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="dnd-stage-item" {...attributes}>
      <span className="drag-handle" {...listeners}><GripVertical size={16} /></span>
      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: stage.accent, flexShrink: 0 }} />
      <span>{stage.name}</span>
      <button
        onClick={() => onRemove(id)}
        style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: '4px' }}
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default function CustomWorkflowBuilder({ initialStages = [], onSave, onCancel }) {
  const [stages, setStages] = useState(initialStages.length > 0 ? initialStages : []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const availableStages = STAGE_POOL.filter(s => !stages.includes(s.id));

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setStages(prev => {
        const oldIndex = prev.indexOf(active.id);
        const newIndex = prev.indexOf(over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const addStage = (stageId) => {
    setStages(prev => [...prev, stageId]);
  };

  const removeStage = (stageId) => {
    setStages(prev => prev.filter(s => s !== stageId));
  };

  const handleSave = () => {
    if (stages.length >= 2) {
      onSave(stages);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <h3 className="modal-title">Custom Workflow Builder</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-5)' }}>
          Add stages from the pool and drag to reorder
        </p>

        {/* Available Stages Pool */}
        <div style={{ marginBottom: 'var(--space-5)' }}>
          <label className="form-label" style={{ marginBottom: 'var(--space-2)', display: 'block' }}>
            Available Stages
          </label>
          <div className="dnd-stage-pool">
            {availableStages.map(stage => (
              <button
                key={stage.id}
                className="dnd-stage-item"
                onClick={() => addStage(stage.id)}
                style={{ cursor: 'pointer' }}
              >
                <Plus size={14} />
                {stage.name}
              </button>
            ))}
            {availableStages.length === 0 && (
              <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
                All stages added
              </span>
            )}
          </div>
        </div>

        {/* Ordered Stages */}
        <div style={{ marginBottom: 'var(--space-5)' }}>
          <label className="form-label" style={{ marginBottom: 'var(--space-2)', display: 'block' }}>
            Workflow Order ({stages.length} stages)
          </label>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={stages} strategy={verticalListSortingStrategy}>
              <div className="dnd-sortable-list">
                {stages.length === 0 ? (
                  <span style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: 'var(--space-6)' }}>
                    Click stages above to add them here
                  </span>
                ) : (
                  stages.map(stageId => {
                    const stage = getStageById(stageId);
                    return stage ? (
                      <SortableStage key={stageId} id={stageId} stage={stage} onRemove={removeStage} />
                    ) : null;
                  })
                )}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        {/* Actions */}
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={stages.length < 2}
          >
            <Save size={18} />
            Save Workflow ({stages.length} stages)
          </button>
        </div>
      </div>
    </div>
  );
}
