
import React, { useMemo } from 'react';
import { getCurrentURL } from '../utils/path';

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QRModal: React.FC<QRModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  // Use useMemo to ensure the URL is stable for the duration of the modal being open
  const currentUrl = useMemo(() => getCurrentURL(), [isOpen]);
  
  // Using a robust external API with slightly different params for better scanability
  // Size 300x300, margin 1, medium error correction
  const qrUrl = useMemo(() => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(currentUrl)}&margin=1&ecc=M`;
  }, [currentUrl]);

  return (
    <div 
      id="qrModal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 transition-all animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative animate-in fade-in zoom-in duration-300 flex flex-col items-center max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          id="qrModalClose"
          onClick={onClose}
          className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-900"
        >
          <i className="ph ph-x text-2xl"></i>
        </button>
        
        <div id="qrCanvas" className="bg-white p-4 rounded-3xl border border-gray-100 shadow-inner mb-6">
          <img 
            src={qrUrl} 
            alt="QR Code" 
            className="w-[240px] h-[240px] block rounded-xl"
            onLoad={() => console.log('QR Code loaded for:', currentUrl)}
            onError={() => console.error('QR Code failed to load')}
          />
        </div>
        
        <div className="text-center w-full px-2">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Share Page</h3>
          <p className="text-sm font-medium text-gray-400 select-none leading-relaxed mb-4">
            Scan this code to open the current page on another device
          </p>
          
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 overflow-hidden">
            <p className="text-[10px] mono text-gray-400 truncate break-all" title={currentUrl}>
              {currentUrl}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRModal;
