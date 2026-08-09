import React from "react";
import { motion } from "framer-motion";

interface ToolButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  shortcut?: string;
}

export default function ToolButton({
  icon,
  label,
  onClick,
  shortcut,
}: ToolButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.08, backgroundColor: "rgba(255, 255, 255, 0.15)" }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="relative group flex items-center wails-no-drag justify-center p-2.5 rounded-xl transition-colors duration-150"
    >
      {icon}
      <span className="absolute -top-9 scale-0 group-hover:scale-100 transition-all duration-150 bg-black/80 text-[11px] px-2 py-0.5 rounded-md border border-white/10 text-white/90 whitespace-nowrap backdrop-blur-md shadow-lg pointer-events-none">
        {label}
        {shortcut ? (
          <span className="ml-1.5 text-white/50">{shortcut}</span>
        ) : null}
      </span>
    </motion.button>
  );
}
