import React, { useEffect, useRef } from 'react';

interface TextEditorProps {
  value: string;
  onChange: (val: string) => void;
  onFinish: () => void;
  position: { x: number; y: number };
  fontSize: number;
  fontFamily: string;
  color: string;
}

export default function TextEditor({ value, onChange, onFinish, position, fontSize, fontFamily, color }: TextEditorProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={e => onChange(e.target.value)}
      onBlur={onFinish}
      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onFinish(); } }}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        fontSize: fontSize,
        fontFamily: fontFamily,
        color: color,
        background: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(4px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        outline: 'none',
        resize: 'none',
        padding: '2px 4px',
        borderRadius: '4px',
        zIndex: 100,
        lineHeight: '1.2',
        minWidth: '80px',
        overflow: 'hidden',
      }}
    />
  );
}