import { useState, useCallback, useRef } from 'react';
import { ShapeConfig } from '@/types/types';

export function useTextEditing(updateShape: (id: string, attrs: Partial<ShapeConfig>, save?: boolean) => void) {
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingTextValue, setEditingTextValue] = useState('');
  const originalTextRef = useRef('');

  const startEditing = useCallback((shape: ShapeConfig) => {
    originalTextRef.current = shape.text || '';
    setEditingTextValue(shape.text || '');
    setEditingTextId(shape.id);
  }, []);

  const updateEditingText = useCallback((value: string) => {
    setEditingTextValue(value);
    if (editingTextId) updateShape(editingTextId, { text: value }, false);
  }, [editingTextId, updateShape]);

  const setEditingText = useCallback((value: string) => {
    setEditingTextValue(value);
  }, []);

  const commitEditing = useCallback((extra?: Partial<ShapeConfig>) => {
    if (editingTextId) {
      updateShape(editingTextId, { text: editingTextValue, ...extra }, true);
      setEditingTextId(null);
    }
  }, [editingTextId, editingTextValue, updateShape]);

  const cancelEditing = useCallback(() => {
    if (editingTextId) {
      updateShape(editingTextId, { text: originalTextRef.current }, false);
      setEditingTextId(null);
    }
  }, [editingTextId, updateShape]);

  return {
    editingTextId,
    editingTextValue,
    startEditing,
    updateEditingText,
    setEditingText,
    commitEditing,
    cancelEditing,
  };
}
