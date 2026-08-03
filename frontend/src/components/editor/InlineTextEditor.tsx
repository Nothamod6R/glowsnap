import React, { useEffect, useLayoutEffect, useRef } from 'react';

interface InlineTextEditorProps {
  value: string;
  onChange: (val: string) => void;
  onCommit: () => void;
  onCancel: () => void;
  left: number;
  top: number;
  rotation: number;
  fontFamily: string;
  fontSize: number;
  fontWeight: number | string;
  fontStyle: 'normal' | 'italic';
  color: string;
  lineHeight: number;
  textDecoration?: string;
  direction: 'ltr' | 'rtl';
  align: 'left' | 'center' | 'right';
  wrapWidth?: number;
  maxWidth: number;
  onMetrics: (width: number, height: number) => void;
}

const MIN_WIDTH = 20;
const PLACEHOLDER = 'Text';

export default function InlineTextEditor({
  value, onChange, onCommit, onCancel,
  left, top, rotation,
  fontFamily, fontSize, fontWeight, fontStyle, color, lineHeight, textDecoration,
  direction, align,
  wrapWidth, maxWidth, onMetrics,
}: InlineTextEditorProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    const isPlaceholder = valueRef.current === PLACEHOLDER;
    if (isPlaceholder) {
      el.select();
    } else {
      const len = el.value.length;
      el.setSelectionRange(len, len);
    }
  }, []);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.style.whiteSpace = 'pre';
    el.style.width = '100000px';
    const naturalWidth = el.scrollWidth;

    let width = wrapWidth && wrapWidth > 0
      ? wrapWidth
      : Math.max(MIN_WIDTH, Math.min(naturalWidth, maxWidth));
    el.style.width = `${width}px`;
    el.style.whiteSpace = 'pre-wrap';

    el.style.height = 'auto';
    const height = el.scrollHeight;
    el.style.height = `${height}px`;

    el.style.transformOrigin = `${width / 2}px ${height / 2}px`;
    onMetrics(width, height);
  }, [value, wrapWidth, maxWidth, fontSize, fontFamily, fontWeight, fontStyle, direction, onMetrics]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={e => onChange(e.target.value)}
      onBlur={onCommit}
      onKeyDown={e => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onCancel();
        } else if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          onCommit();
        }
      }}
      spellCheck={false}
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      style={{
        position: 'absolute',
        left,
        top,
        transform: rotation ? `rotate(${rotation}deg)` : undefined,
        background: 'transparent',
        border: 'none',
        outline: 'none',
        boxShadow: 'none',
        resize: 'none',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        whiteSpace: 'pre-wrap',
        overflowWrap: 'break-word',
        fontFamily,
        fontSize,
        fontWeight,
        fontStyle,
        color,
        lineHeight,
        textDecoration: textDecoration || 'none',
        caretColor: color,
        direction,
        textAlign: align,
        fontVariantLigatures: 'none',
        zIndex: 100,
      }}
    />
  );
}
