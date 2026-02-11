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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCanvasStore } from '@/presentation/stores/canvas.store';
import {
  FlowCanvas,
  CanvasSidebar,
  NodeEditorPanel,
} from '@/presentation/components/canvas';
import { PreviewModal } from '@/presentation/components/preview';
import type { QuestionType } from '@/domain/entities/flow';

// Debounce helper
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

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
    nodes,
    edges,
    isDirty,
    isSaving,
    lastSavedAt,
    setAssessment,
    updateTitle,
    updateDescription,
    loadCanvas,
    addQuestionNode,
    addNode,
    markSaved,
    setSaving,
    getFlowData,
  } = useCanvasStore();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editableTitle, setEditableTitle] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Debounced dirty state for auto-save
  const debouncedIsDirty = useDebounce(isDirty, 2000);

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
        setAssessment(assessment.id, assessment.title, assessment.description);
        loadCanvas(assessment.nodes, assessment.edges);
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

  // Auto-save when dirty and debounced
  useEffect(() => {
    if (debouncedIsDirty && !isSaving) {
      saveAssessment();
    }
  }, [debouncedIsDirty]);

  // Save assessment
  const saveAssessment = useCallback(async () => {
    if (isSaving) return;

    try {
      setSaving(true);
      const flowData = getFlowData();

      const response = await fetch(`/api/assessments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          nodes: flowData.nodes,
          edges: flowData.edges,
        }),
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
  }, [id, title, description, isSaving, setSaving, getFlowData, markSaved]);

  // Handle title edit
  const handleTitleSubmit = useCallback(() => {
    if (editableTitle.trim() && editableTitle !== title) {
      updateTitle(editableTitle.trim());
    } else {
      setEditableTitle(title);
    }
    setIsEditingTitle(false);
  }, [editableTitle, title, updateTitle]);

  // Handle adding nodes from sidebar
  const handleAddNode = useCallback(
    (
      type: 'question' | 'end',
      position?: { x: number; y: number },
      questionType?: QuestionType
    ) => {
      const pos = position || {
        x: 250 + Math.random() * 100,
        y: 200 + nodes.length * 150,
      };

      if (type === 'question' && questionType) {
        addQuestionNode(questionType, pos);
      } else {
        addNode(type, pos);
      }
    },
    [nodes.length, addQuestionNode, addNode]
  );

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        saveAssessment();
      }
      // Escape to close preview
      if (e.key === 'Escape' && isPreviewOpen) {
        setIsPreviewOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveAssessment, isPreviewOpen]);

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
              'bg-primary text-primary-foreground',
              'hover:bg-primary/90'
            )}
          >
            <Eye className="h-4 w-4" />
            <span className="text-sm font-medium">Preview</span>
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <CanvasSidebar
          onAddNode={(type, questionType) => handleAddNode(type, undefined, questionType)}
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
      />
    </div>
  );
}
