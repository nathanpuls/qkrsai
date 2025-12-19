
import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 2000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-full shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
      <i className="ph ph-check-circle text-xl text-green-400"></i>
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};

export default Toast;
