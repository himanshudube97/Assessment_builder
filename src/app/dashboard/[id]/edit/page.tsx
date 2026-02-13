'use client';

/**
 * Assessment Editor Page
 * The main canvas editor for creating/editing assessments
 */

import { useEffect, useCallback, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Save,
  Eye,
  Loader2,
  Check,
  Cloud,
  CloudOff,
  Pencil,
  Globe,
  Palette,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCanvasStore, canvasUndo, canvasRedo, canvasClearHistory } from '@/presentation/stores/canvas.store';
import {
  FlowCanvas,
  CanvasSidebar,
  NodeEditorPanel,
} from '@/presentation/components/canvas';
import { PreviewModal } from '@/presentation/components/preview';
import { PublishModal } from '@/presentation/components/publish';
import { AppearanceModal } from '@/presentation/components/appearance';
import type { PublishSettings } from '@/presentation/components/publish/PublishModal';
import type { AssessmentSettings } from '@/domain/entities/assessment';
import type { QuestionType } from '@/domain/entities/flow';

interface EditorPageProps {
  params: Promise<{ id: string }>;
}

export default function EditorPage({ params }: EditorPageProps) {
  const { id } = use(params);
  const router = useRouter();

  // Canvas store
  const {
    title,
    description,
    status,
    publishedAt,
    closeAt,
    responseCount,
    settings,
    nodes,
    edges,
    isDirty,
    isSaving,
    lastSavedAt,
    isFlowLocked,
    setAssessment,
    setStatus,
    updateTitle,
    updateDescription,
    loadCanvas,
    addQuestionNode,
    addNode,
    markSaved,
    setSaving,
    getFlowData,
    updateSettings,
  } = useCanvasStore();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editableTitle, setEditableTitle] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isAppearanceOpen, setIsAppearanceOpen] = useState(false);

  // Load assessment on mount
  useEffect(() => {
    async function loadAssessment() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/assessments/${id}`);
        if (!response.ok) {
          throw new Error('Failed to load assessment');
        }

        const assessment = await response.json();
        setAssessment(
          assessment.id,
          assessment.title,
          assessment.description,
          assessment.status,
          assessment.publishedAt,
          assessment.settings?.closeAt,
          assessment.responseCount ?? 0,
          assessment.settings ?? null
        );
        loadCanvas(assessment.nodes, assessment.edges);
        canvasClearHistory(); // Don't count initial load as undoable
        setEditableTitle(assessment.title);
      } catch (err) {
        console.error('Error loading assessment:', err);
        setError('Failed to load assessment');
      } finally {
        setIsLoading(false);
      }
    }

    loadAssessment();
  }, [id, setAssessment, loadCanvas]);

  // Save assessment
  const saveAssessment = useCallback(async () => {
    if (isSaving) return;

    try {
      setSaving(true);
      const flowData = getFlowData();

      // When flow is locked, only save metadata (title/description)
      const payload: Record<string, unknown> = { title, description };
      if (!isFlowLocked) {
        payload.nodes = flowData.nodes;
        payload.edges = flowData.edges;
      }

      const response = await fetch(`/api/assessments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to save');
      }

      markSaved();
    } catch (err) {
      console.error('Error saving:', err);
    } finally {
      setSaving(false);
    }
  }, [id, title, description, isFlowLocked, isSaving, setSaving, getFlowData, markSaved]);

  // Auto-save: check every 5 seconds, save if dirty
  useEffect(() => {
    const intervalId = setInterval(() => {
      const { isDirty, isSaving } = useCanvasStore.getState();
      if (isDirty && !isSaving) {
        saveAssessment();
      }
    }, 5000);
    return () => clearInterval(intervalId);
  }, [saveAssessment]);

  // Save when user switches tabs (prevents losing last <5s of work)
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'hidden') {
        const { isDirty, isSaving } = useCanvasStore.getState();
        if (isDirty && !isSaving) {
          saveAssessment();
        }
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [saveAssessment]);

  // Publish assessment
  const handlePublish = useCallback(async (publishSettings: PublishSettings) => {
    try {
      const response = await fetch(`/api/assessments/${id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          closeAt: publishSettings.closeAt?.toISOString(),
          openAt: publishSettings.openAt?.toISOString(),
          maxResponses: publishSettings.maxResponses,
          password: publishSettings.password,
        }),
      });

      // Handle validation errors
      if (response.status === 400) {
        const data = await response.json();
        return { validationErrors: data.validationErrors || [] };
      }

      if (!response.ok) {
        throw new Error('Failed to publish');
      }

      const published = await response.json();
      setStatus('published', published.publishedAt);
      return {};
    } catch (err) {
      console.error('Error publishing:', err);
      throw err;
    }
  }, [id, setStatus]);

  // Close assessment
  const handleCloseAssessment = useCallback(async () => {
    try {
      const response = await fetch(`/api/assessments/${id}/close`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to close');
      }

      setStatus('closed');
    } catch (err) {
      console.error('Error closing:', err);
      throw err;
    }
  }, [id, setStatus]);

  // Unpublish assessment (revert to draft)
  const handleUnpublish = useCallback(async () => {
    try {
      const response = await fetch(`/api/assessments/${id}/unpublish`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to unpublish');
      }

      setStatus('draft');
    } catch (err) {
      console.error('Error unpublishing:', err);
      throw err;
    }
  }, [id, setStatus]);

  // Update publish settings (schedule, max responses, etc.) while published
  const handleUpdatePublishSettings = useCallback(async (settingsUpdate: Partial<AssessmentSettings>) => {
    const response = await fetch(`/api/assessments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: settingsUpdate }),
    });

    if (!response.ok) {
      throw new Error('Failed to update settings');
    }

    updateSettings(settingsUpdate);
  }, [id, updateSettings]);

  // Update appearance/theme settings
  const handleSettingsChange = useCallback(async (themeSettings: Partial<AssessmentSettings>) => {
    const response = await fetch(`/api/assessments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: themeSettings }),
    });

    if (!response.ok) {
      throw new Error('Failed to save appearance settings');
    }

    updateSettings(themeSettings);
  }, [id, updateSettings]);

  // Handle title edit
  const handleTitleSubmit = useCallback(() => {
    if (editableTitle.trim() && editableTitle !== title) {
      updateTitle(editableTitle.trim());
    } else {
      setEditableTitle(title);
    }
    setIsEditingTitle(false);
  }, [editableTitle, title, updateTitle]);

  // Get selected node from store
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);

  // Calculate smart position for new nodes
  const calculateSmartPosition = useCallback(() => {
    const NODE_WIDTH = 280;
    const NODE_HEIGHT = 180;
    const SPACING_Y = 60;

    // Helper to check if position overlaps with any existing node
    const hasOverlap = (x: number, y: number) => {
      return nodes.some((n) => {
        const dx = Math.abs(n.position.x - x);
        const dy = Math.abs(n.position.y - y);
        return dx < NODE_WIDTH + 20 && dy < NODE_HEIGHT + 20;
      });
    };

    // Helper to find non-overlapping position
    const findNonOverlappingPosition = (baseX: number, baseY: number) => {
      let x = baseX;
      let y = baseY;
      let attempts = 0;

      while (hasOverlap(x, y) && attempts < 10) {
        y += NODE_HEIGHT + SPACING_Y;
        attempts++;
      }
      return { x, y };
    };

    // If a node is selected, place below it
    if (selectedNodeId) {
      const selectedNode = nodes.find((n) => n.id === selectedNodeId);
      if (selectedNode) {
        return findNonOverlappingPosition(
          selectedNode.position.x,
          selectedNode.position.y + NODE_HEIGHT + SPACING_Y
        );
      }
    }

    // No selection - calculate center of existing nodes and place below
    if (nodes.length > 0) {
      // Calculate bounding box
      let minX = Infinity, maxX = -Infinity;
      let maxY = -Infinity;

      nodes.forEach((n) => {
        minX = Math.min(minX, n.position.x);
        maxX = Math.max(maxX, n.position.x + NODE_WIDTH);
        maxY = Math.max(maxY, n.position.y + NODE_HEIGHT);
      });

      // Place at horizontal center, below all nodes
      const centerX = minX + (maxX - minX) / 2 - NODE_WIDTH / 2;
      const newY = maxY + SPACING_Y;

      return findNonOverlappingPosition(centerX, newY);
    }

    // No nodes exist - place at a default starting position
    return { x: 300, y: 200 };
  }, [nodes, selectedNodeId]);

  // Handle adding nodes from sidebar
  const handleAddNode = useCallback(
    (
      type: 'question' | 'end',
      position?: { x: number; y: number },
      questionType?: QuestionType
    ) => {
      // Use provided position (from drag/drop) or calculate smart position
      const pos = position || calculateSmartPosition();

      if (type === 'question' && questionType) {
        addQuestionNode(questionType, pos);
      } else {
        addNode(type, pos);
      }
    },
    [calculateSmartPosition, addQuestionNode, addNode]
  );

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept undo/redo when typing in form inputs
      const target = e.target as HTMLElement;
      const isInputFocused =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        saveAssessment();
      }
      // Undo: Ctrl/Cmd+Z (disabled when flow is locked)
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey && !isInputFocused && !isFlowLocked) {
        e.preventDefault();
        canvasUndo();
      }
      // Redo: Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y (disabled when flow is locked)
      if (
        (((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'z') ||
        ((e.metaKey || e.ctrlKey) && e.key === 'y')) &&
        !isInputFocused && !isFlowLocked
      ) {
        e.preventDefault();
        canvasRedo();
      }
      // Escape to close preview
      if (e.key === 'Escape' && isPreviewOpen) {
        setIsPreviewOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveAssessment, isPreviewOpen, isFlowLocked]);

  // Get flow data for preview
  const flowData = getFlowData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading editor...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-4 text-center"
        >
          <div className="p-4 rounded-full bg-destructive/10">
            <CloudOff className="h-8 w-8 text-destructive" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">
              Failed to load assessment
            </h2>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Back to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-4">
          {/* Back button */}
          <button
            onClick={() => router.push('/dashboard')}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </button>

          {/* Editable Title */}
          <div>
            {isEditingTitle ? (
              <input
                type="text"
                value={editableTitle}
                onChange={(e) => setEditableTitle(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTitleSubmit();
                  if (e.key === 'Escape') {
                    setEditableTitle(title);
                    setIsEditingTitle(false);
                  }
                }}
                autoFocus
                className="font-semibold text-foreground bg-transparent border-b-2 border-primary focus:outline-none px-1 py-0.5 min-w-[200px]"
              />
            ) : (
              <button
                onClick={() => setIsEditingTitle(true)}
                className="flex items-center gap-2 group"
              >
                <h1 className="font-semibold text-foreground">{title}</h1>
                <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {/* Save status */}
              <AnimatePresence mode="wait">
                {isSaving ? (
                  <motion.span
                    key="saving"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1"
                  >
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Saving...
                  </motion.span>
                ) : isDirty ? (
                  <motion.span
                    key="unsaved"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1 text-amber-500"
                  >
                    <Cloud className="h-3 w-3" />
                    Unsaved changes
                  </motion.span>
                ) : lastSavedAt ? (
                  <motion.span
                    key="saved"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1 text-emerald-500"
                  >
                    <Check className="h-3 w-3" />
                    Saved
                  </motion.span>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Save button */}
          <button
            onClick={saveAssessment}
            disabled={isSaving || !isDirty}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg transition-all',
              'bg-muted text-muted-foreground',
              'hover:bg-muted/80',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">Save</span>
          </button>

          {/* Preview button */}
          <button
            onClick={() => setIsPreviewOpen(true)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg transition-all',
              'bg-muted text-muted-foreground',
              'hover:bg-muted/80'
            )}
          >
            <Eye className="h-4 w-4" />
            <span className="text-sm font-medium">Preview</span>
          </button>

          {/* Appearance button */}
          <button
            onClick={() => setIsAppearanceOpen(true)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg transition-all',
              'bg-muted text-muted-foreground',
              'hover:bg-muted/80'
            )}
          >
            <Palette className="h-4 w-4" />
            <span className="text-sm font-medium">Appearance</span>
          </button>

          {/* Publish button */}
          <button
            onClick={() => setIsPublishModalOpen(true)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg transition-all',
              status === 'published'
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            )}
          >
            <Globe className="h-4 w-4" />
            <span className="text-sm font-medium">
              {status === 'published' ? 'Published' : status === 'closed' ? 'Closed' : 'Publish'}
            </span>
          </button>
        </div>
      </header>

      {/* Flow locked banner */}
      {isFlowLocked && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-sm">
          <Lock className="h-4 w-4 shrink-0" />
          <span>
            This assessment is {status}. The flow structure is locked to protect response data.
            You can still edit the title, appearance, and publish settings.
          </span>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <CanvasSidebar
          onAddNode={(type, questionType) => handleAddNode(type, undefined, questionType)}
          disabled={isFlowLocked}
        />

        {/* Canvas */}
        <FlowCanvas
          onAddNode={(type, position, questionType) =>
            handleAddNode(type, position, questionType)
          }
        />

        {/* Editor Panel */}
        <NodeEditorPanel />
      </div>

      {/* Preview Modal */}
      <PreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        nodes={flowData.nodes}
        edges={flowData.edges}
        title={title}
        settings={settings}
      />

      {/* Appearance Modal */}
      <AppearanceModal
        isOpen={isAppearanceOpen}
        onClose={() => setIsAppearanceOpen(false)}
        currentSettings={settings}
        onApply={handleSettingsChange}
      />

      {/* Publish Modal */}
      <PublishModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        assessmentId={id}
        title={title}
        status={status}
        publishedAt={publishedAt}
        closeAt={closeAt}
        responseCount={responseCount}
        settings={settings}
        onPublish={handlePublish}
        onCloseAssessment={handleCloseAssessment}
        onUnpublish={handleUnpublish}
        onUpdateSettings={handleUpdatePublishSettings}
      />
    </div>
  );
}
