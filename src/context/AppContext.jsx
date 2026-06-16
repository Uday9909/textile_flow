// ============================================================
// TextileFlow MES — App Context (State Management)
// ============================================================

import { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { INITIAL_LOTS, WORKFLOW_TEMPLATES, DEPT_CAPACITY, getStageById } from '../data/mockData';
import { fetchLots, updateLot } from '../api';

const AppContext = createContext(null);

// ── Storage Keys ──
const STORAGE_KEY = 'textileflow_state';
const CHANNEL_NAME = 'textileflow-sync';

// ── Load initial state ──
function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Failed to load state from localStorage:', e);
  }
  return null;
}

function getInitialState() {
  const saved = loadState();
  // Use cached state as fallback, but expect API to overwrite lots
  return {
    lots: saved?.lots || INITIAL_LOTS,
    workflows: WORKFLOW_TEMPLATES,
    notifications: [],
    operatorName: localStorage.getItem('textileflow_operator') || '',
    department: localStorage.getItem('textileflow_department') || '',
    undoAction: null, // { type, payload, expiresAt }
  };
}

// ── Auto-Escalation Logic ──
function checkAutoEscalation(lot) {
  if (lot.status !== 'waiting') return lot;

  const currentStage = lot.stages[lot.currentStageIndex];
  const stageInfo = getStageById(currentStage);
  const stageHistory = lot.stageHistory[lot.stageHistory.length - 1];

  if (!stageInfo || !stageHistory || !stageHistory.waitingSince) return lot;

  const waitingHours = (Date.now() - new Date(stageHistory.waitingSince).getTime()) / (1000 * 60 * 60);
  const expectedHours = stageInfo.expectedHours;

  // Auto-escalate to urgent if waiting > 2x expected
  if (waitingHours > expectedHours * 2 && lot.priority !== 'urgent') {
    return { ...lot, priority: 'urgent', autoEscalated: true };
  }

  return lot;
}

// ── Reducer ──
function appReducer(state, action) {
  switch (action.type) {
    case 'CREATE_LOT': {
      const { lot } = action.payload;
      const newNotification = {
        id: 'notif_' + Date.now(),
        type: 'new_lot',
        lotId: lot.id,
        lotNumber: lot.lotNumber,
        partyName: lot.partyName,
        quantity: lot.quantity,
        targetDepartment: lot.stages[0],
        message: `New Lot ${lot.lotNumber} created — Ready for ${getStageById(lot.stages[0])?.name || lot.stages[0]}`,
        timestamp: new Date().toISOString(),
        dismissed: false,
      };
      return {
        ...state,
        lots: [...(state.lots || []), lot],
        notifications: [newNotification, ...state.notifications],
      };
    }

    case 'START_STAGE': {
      const { lotId, operatorName } = action.payload;
      return {
        ...state,
        lots: state.lots.map(lot => {
          if (lot.id !== lotId) return lot;
          const currentStage = lot.stages[lot.currentStageIndex];
          const updatedHistory = lot.stageHistory.map((h, i) => {
            if (i === lot.stageHistory.length - 1 && h.stageId === currentStage) {
              return {
                ...h,
                status: 'inprocess',
                startTime: new Date().toISOString(),
                operator: operatorName || state.operatorName || 'Unknown',
              };
            }
            return h;
          });
          return { ...lot, status: 'inprocess', stageHistory: updatedHistory };
        }),
      };
    }

    case 'COMPLETE_STAGE': {
      const { lotId, operatorName } = action.payload;
      const lot = state.lots.find(l => l.id === lotId);
      if (!lot) return state;

      const currentStage = lot.stages[lot.currentStageIndex];
      const nextStageIndex = lot.currentStageIndex + 1;
      const isLastStage = nextStageIndex >= lot.stages.length;
      const nextStage = isLastStage ? null : lot.stages[nextStageIndex];

      const updatedHistory = lot.stageHistory.map((h, i) => {
        if (i === lot.stageHistory.length - 1 && h.stageId === currentStage) {
          return {
            ...h,
            status: 'complete',
            endTime: new Date().toISOString(),
            operator: operatorName || h.operator || state.operatorName || 'Unknown',
          };
        }
        return h;
      });

      // Add next stage to history if not last
      if (!isLastStage) {
        updatedHistory.push({
          stageId: nextStage,
          status: 'waiting',
          startTime: null,
          endTime: null,
          operator: null,
          waitingSince: new Date().toISOString(),
        });
      }

      const updatedLot = {
        ...lot,
        currentStageIndex: isLastStage ? lot.currentStageIndex : nextStageIndex,
        status: isLastStage ? 'complete' : 'waiting',
        stageHistory: updatedHistory,
      };

      // Create notification for next department
      const notifications = [...state.notifications];
      if (!isLastStage) {
        notifications.unshift({
          id: 'notif_' + Date.now(),
          type: 'stage_complete',
          lotId: lot.id,
          lotNumber: lot.lotNumber,
          partyName: lot.partyName,
          quantity: lot.quantity,
          targetDepartment: nextStage,
          fromDepartment: currentStage,
          message: `Lot ${lot.lotNumber} ready for ${getStageById(nextStage)?.name || nextStage}`,
          timestamp: new Date().toISOString(),
          dismissed: false,
        });
      }

      // Save undo action
      const undoAction = {
        type: 'UNDO_COMPLETE',
        payload: { lotId, previousLot: lot },
        expiresAt: Date.now() + 30000, // 30 seconds
      };

      return {
        ...state,
        lots: state.lots.map(l => l.id === lotId ? updatedLot : l),
        notifications,
        undoAction,
      };
    }

    case 'UNDO_COMPLETE': {
      const { lotId, previousLot } = action.payload;
      // Remove the last notification that was added for this lot
      const notifications = state.notifications.filter(
        n => !(n.lotId === lotId && n.type === 'stage_complete' &&
               new Date(n.timestamp).getTime() > Date.now() - 35000)
      );
      return {
        ...state,
        lots: state.lots.map(l => l.id === lotId ? previousLot : l),
        notifications,
        undoAction: null,
      };
    }

    case 'CLEAR_UNDO': {
      return { ...state, undoAction: null };
    }

    case 'DISMISS_NOTIFICATION': {
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === action.payload.notificationId ? { ...n, dismissed: true } : n
        ),
      };
    }

    case 'DISMISS_ALL_NOTIFICATIONS': {
      return {
        ...state,
        notifications: state.notifications.map(n => ({ ...n, dismissed: true })),
      };
    }

    case 'SET_OPERATOR': {
      const { name, department } = action.payload;
      localStorage.setItem('textileflow_operator', name);
      if (department) localStorage.setItem('textileflow_department', department);
      return { ...state, operatorName: name, department: department || '' };
    }

    case 'CLEAR_OPERATOR': {
      localStorage.removeItem('textileflow_operator');
      localStorage.removeItem('textileflow_department');
      return { ...state, operatorName: '', department: '' };
    }

    case 'SYNC_LOTS': {
      return { ...state, lots: action.payload || [] };
    }

    case 'ADD_WORKFLOW': {
      return {
        ...state,
        workflows: [...state.workflows, action.payload.workflow],
      };
    }

    case 'SYNC_STATE': {
      // Merge incoming state from another tab
      return { ...action.payload };
    }

    case 'CHECK_ESCALATIONS': {
      const updatedLots = state.lots.map(lot => checkAutoEscalation(lot));
      const hasChanges = updatedLots.some((lot, i) => lot !== state.lots[i]);
      return hasChanges ? { ...state, lots: updatedLots } : state;
    }

    default:
      return state;
  }
}

// ── Provider Component ──
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, undefined, getInitialState);
  const channelRef = useRef(null);
  const isExternalUpdate = useRef(false);

  // Initialize BroadcastChannel for cross-tab sync
  useEffect(() => {
    try {
      channelRef.current = new BroadcastChannel(CHANNEL_NAME);

      channelRef.current.onmessage = (event) => {
        if (event.data?.type === 'STATE_UPDATE') {
          isExternalUpdate.current = true;
          dispatch({ type: 'SYNC_STATE', payload: event.data.state });
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported:', e);
    }

    return () => {
      if (channelRef.current) {
        channelRef.current.close();
      }
    };
  }, []);

  // Sync lots from backend — primary source of truth
  useEffect(() => {
    fetchLots({ limit: 500 })
      .then(data => {
        if (data?.lots) {
          dispatch({ type: 'SYNC_LOTS', payload: data.lots });
        }
      })
      .catch(() => {
        // API unavailable — keep local state as offline fallback
        console.warn('Backend unavailable — using local lot data');
      });
  }, []);

  // Sync lot changes to backend (debounced, skips first render)
  const isFirstRender = useRef(true);
  const syncTimerRef = useRef(null);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(async () => {
      for (const lot of state.lots) {
        try {
          await updateLot(lot.id || lot.lotNumber, {
            currentStageIndex: lot.currentStageIndex,
            status: lot.status,
            stageHistory: lot.stageHistory,
          });
        } catch {
          // Local state is preserved — API sync is best-effort
        }
      }
    }, 2000);
    return () => { if (syncTimerRef.current) clearTimeout(syncTimerRef.current); };
  }, [state.lots]);

  // Persist state and broadcast on every change
  useEffect(() => {
    // Don't re-broadcast external updates
    if (isExternalUpdate.current) {
      isExternalUpdate.current = false;
      return;
    }

    // Save to localStorage
    try {
      const stateToSave = { ...state, undoAction: null }; // Don't persist undo across tabs
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.warn('Failed to save state:', e);
    }

    // Broadcast to other tabs
    if (channelRef.current) {
      try {
        channelRef.current.postMessage({
          type: 'STATE_UPDATE',
          state: { ...state, undoAction: null },
        });
      } catch (e) {
        console.warn('Failed to broadcast state:', e);
      }
    }
  }, [state]);

  // Auto-escalation check every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch({ type: 'CHECK_ESCALATIONS' });
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Undo timer
  useEffect(() => {
    if (!state.undoAction) return;

    const remaining = state.undoAction.expiresAt - Date.now();
    if (remaining <= 0) {
      dispatch({ type: 'CLEAR_UNDO' });
      return;
    }

    const timer = setTimeout(() => {
      dispatch({ type: 'CLEAR_UNDO' });
    }, remaining);

    return () => clearTimeout(timer);
  }, [state.undoAction]);

  // Auto-dismiss notifications after 10 seconds
  useEffect(() => {
    const undismissed = state.notifications.filter(n => !n.dismissed);
    if (undismissed.length === 0) return;
    const timers = undismissed.map(n => {
      const age = Date.now() - new Date(n.timestamp).getTime();
      const remaining = Math.max(0, 10000 - age);
      return setTimeout(() => dispatch({ type: 'DISMISS_NOTIFICATION', payload: { notificationId: n.id } }), remaining);
    });
    return () => timers.forEach(t => clearTimeout(t));
  }, [state.notifications]);

  // Helper functions
  const getLotsForDepartment = useCallback((departmentId) => {
    return (state.lots || []).filter(lot => {
      const currentStage = lot.stages[lot.currentStageIndex];
      return currentStage === departmentId && lot.status !== 'complete';
    });
  }, [state.lots]);

  const getInProcessLots = useCallback((departmentId) => {
    return (state.lots || []).filter(lot => {
      const currentStage = lot.stages[lot.currentStageIndex];
      return currentStage === departmentId && lot.status === 'inprocess';
    });
  }, [state.lots]);

  const getWaitingLots = useCallback((departmentId) => {
    const lots = state.lots.filter(lot => {
      const currentStage = lot.stages[lot.currentStageIndex];
      return currentStage === departmentId && lot.status === 'waiting';
    });
    // Sort: urgent first, then normal, then low, then by waitingSince
    const priorityOrder = { urgent: 0, normal: 1, low: 2 };
    return lots.sort((a, b) => {
      const pa = priorityOrder[a.priority] ?? 1;
      const pb = priorityOrder[b.priority] ?? 1;
      if (pa !== pb) return pa - pb;
      // Then by waiting time (oldest first)
      const aWait = a.stageHistory[a.stageHistory.length - 1]?.waitingSince || a.createdAt;
      const bWait = b.stageHistory[b.stageHistory.length - 1]?.waitingSince || b.createdAt;
      return new Date(aWait) - new Date(bWait);
    });
  }, [state.lots]);

  const getCompletedTodayLots = useCallback((departmentId) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return (state.lots || []).filter(lot => {
      return lot.stageHistory.some(h => {
        return h.stageId === departmentId &&
               h.status === 'complete' &&
               h.endTime &&
               new Date(h.endTime) >= today;
      });
    });
  }, [state.lots]);

  const getDepartmentCapacity = useCallback((departmentId) => {
    return DEPT_CAPACITY[departmentId] || 1;
  }, []);

  const getActiveNotifications = useCallback((departmentId) => {
    return state.notifications.filter(n => !n.dismissed && (!departmentId || n.targetDepartment === departmentId));
  }, [state.notifications]);

  const getCompletedLots = useCallback(() => {
    return (state.lots || []).filter(lot => {
      const lastStage = lot.stages[lot.stages.length - 1];
      const lastHistory = lot.stageHistory.find(h => h.stageId === lastStage);
      return lastHistory?.status === 'complete';
    });
  }, [state.lots]);

  const getDispatchableLots = useCallback(() => {
    return (state.lots || []).filter(lot => {
      // All stages except dispatch are complete, or lot is at dispatch stage
      const dispatchIndex = lot.stages.indexOf('dispatch');
      if (dispatchIndex === -1) return false;
      // Check if all stages before dispatch are complete
      return lot.stageHistory.filter(h => h.status === 'complete').length >= dispatchIndex;
    });
  }, [state.lots]);

  const resetData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  }, []);

  // Ensure lots is always an array — prevents filter/find crashes downstream
  const safeState = { ...state, lots: state.lots || [] };
  const value = {
    state: safeState,
    dispatch,
    getLotsForDepartment,
    getInProcessLots,
    getWaitingLots,
    getCompletedTodayLots,
    getDepartmentCapacity,
    getActiveNotifications,
    getCompletedLots,
    getDispatchableLots,
    resetData,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export default AppContext;
