
import React from 'react';
import { Mode } from '../types';
import Tooltip from './Tooltip';

interface ToolbarProps {
  mode: Mode;
  toggleMode: () => void;
  onHome: () => void;
  onCopy: () => void;
  onCopyLink: () => void;
  onSearch: () => void;
  onQR: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ 
  mode, 
  toggleMode, 
  onHome, 
  onCopy, 
  onCopyLink, 
  onSearch, 
  onQR 
}) => {
  const Button = ({ icon, onClick, label, active = false, className = "" }: any) => (
    <Tooltip content={label}>
      <button
        onClick={onClick}
        className={`
          flex items-center justify-center p-3 rounded-xl transition-all active:scale-95
          ${active ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-600'}
          ${className}
        `}
      >
        <i className={`ph ${icon} text-2xl`}></i>
      </button>
    </Tooltip>
  );

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 px-4 w-full max-w-lg">
      <div className="bg-white/90 backdrop-blur-md border border-gray-100 rounded-2xl shadow-xl flex items-center justify-between p-2">
        <Button icon="ph-magnifying-glass" onClick={onSearch} label="Search (Alt+S)" />
        <Button icon="ph-house" onClick={onHome} label="Go Home" />
        
        <Button icon="ph-copy" onClick={onCopy} label="Copy Content" />
        <Button icon="ph-link" onClick={onCopyLink} label="Copy Link" />
        <Button icon="ph-qr-code" onClick={onQR} label="Show QR Code" />

        <div className="h-8 w-px bg-gray-100 mx-1"></div>

        <Button 
          icon={mode === 'view' ? "ph-pencil-simple" : "ph-eye"} 
          onClick={toggleMode} 
          label={mode === 'view' ? "Edit Mode" : "View Mode"}
          active={mode === 'edit'}
          className={mode === 'edit' ? "bg-indigo-600 text-white hover:bg-indigo-700" : ""}
        />
      </div>
    </div>
  );
};

export default Toolbar;
