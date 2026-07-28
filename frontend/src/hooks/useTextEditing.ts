import { useState } from 'react';
import { ShapeConfig } from '@/types/types';

export function useTextEditing(updateShape: (id: string, attrs: Partial<ShapeConfig>) => void) {
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingTextValue, setEditingTextValue] = useState('');
  const [editingTextPosition, setEditingTextPosition] = useState({ x: 0, y: 0 });

  const startEditing = (shape: ShapeConfig) => {
    setEditingTextId(shape.id);
    setEditingTextValue(shape.text || '');
    setEditingTextPosition({ x: shape.x, y: shape.y });
  };

  const finishEditing = () => {
    if (editingTextId) {
      updateShape(editingTextId, { text: editingTextValue });
      setEditingTextId(null);
    }
  };

  return { editingTextId, editingTextValue, editingTextPosition, startEditing, finishEditing, setEditingTextValue };
}