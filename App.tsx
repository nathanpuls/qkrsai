
import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Mode } from './types';
import { getPageFromPath, setPathPage, copyToClipboard, getCurrentURL, sanitizePageName, generateRandomPage } from './utils/path';
import { formatContent } from './utils/formatter';
import { subscribeToPage, updatePageContent } from './services/firebase';
import Toolbar from './components/Toolbar';
import QRModal from './components/QRModal';
import Toast from './components/Toast';

const App: React.FC = () => {
  const [page, setPage] = useState<string>(getPageFromPath());
  const [mode, setMode] = useState<Mode>('view');
  const [content, setContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [toast, setToast] = useState<{ message: string; isVisible: boolean }>({ message: '', isVisible: false });
  
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const homeSearchRef = useRef<HTMLInputElement>(null);
  const saveTimeout = useRef<number | null>(null);

  const isHome = page === 'home';
  const isSpecial = page.startsWith('x-');

  // Listen for navigation events via hashchange
  useEffect(() => {
    const handleNavigation = () => {
      const newPage = getPageFromPath();
      setPage(newPage);
      setMode('view');
      setSearchValue('');
      setError(null);
    };

    window.addEventListener('hashchange', handleNavigation);
    // Also handle initial load correctly
    handleNavigation();

    return () => window.removeEventListener('hashchange', handleNavigation);
  }, []);

  // Firebase Subscription
  useEffect(() => {
    if (isHome || isSpecial) {
      setContent('');
      return;
    }

    const unsubscribe = subscribeToPage(page, 
      (newContent) => {
        setContent(newContent);
        setError(null);
      },
      (err) => {
        if (err.code?.includes('permission_denied')) {
          setError("Firebase Permission Denied. Check your security rules.");
        } else {
          setError(`Firebase Error: ${err.message}`);
        }
      }
    );
    return () => unsubscribe();
  }, [page, isHome, isSpecial]);

  useEffect(() => {
    if (mode === 'edit' && editorRef.current) {
      editorRef.current.focus();
    }
    window.scrollTo(0, 0);
  }, [mode]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);

    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = window.setTimeout(async () => {
      try {
        await updatePageContent(page, newContent);
      } catch (err: any) {
        console.error(err);
      }
    }, 200);
  };

  const showToast = (message: string) => {
    setToast({ message, isVisible: true });
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = ['INPUT', 'TEXTAREA'].includes(target.tagName);

      if (e.key === 'Escape') {
        if (mode === 'edit') setMode('view');
        setIsQRModalOpen(false);
        (isHome ? homeSearchRef : searchRef).current?.blur();
        return;
      }

      if (isInput) return;

      const key = e.key.toLowerCase();
      if (key === 'e') {
        e.preventDefault();
        setMode('edit');
      } else if (key === 's') {
        e.preventDefault();
        (isHome ? homeSearchRef : searchRef).current?.focus();
      } else if (key === 'c') {
        e.preventDefault();
        copyToClipboard(content).then(success => success && showToast('Content copied'));
      } else if (key === 'l') {
        e.preventDefault();
        copyToClipboard(getCurrentURL()).then(success => success && showToast('Link copied'));
      } else if (key === 'h') {
        e.preventDefault();
        setPathPage('home');
      } else if (key === 'q') {
        e.preventDefault();
        setIsQRModalOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, isHome, content]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      setPathPage(searchValue.trim());
    }
  };

  if (isSpecial) {
    const isAbout = page === 'x-about';
    const isShortcuts = page === 'x-shortcuts';

    return (
      <div className="min-h-screen bg-white flex flex-col text-[#111]">
        <div className="max-w-[700px] w-full mx-auto px-5 pt-10 flex-grow">
          <h1 className="text-[28px] font-medium mb-[30px] border-b-2 border-[#ccc] pb-[10px] flex items-center gap-[10px]">
            {isAbout ? <i className="ph-bold ph-info"></i> : <i className="ph-bold ph-command"></i>}
            {isAbout ? 'About qkrsai' : 'Keyboard Shortcuts'}
          </h1>
          
          <div className="w-full text-[#555] leading-[1.6]">
            {isAbout ? (
              <div className="space-y-6 text-base">
                <p>qkrsai is a minimalist, real-time interactive editor designed for fast text sharing.</p>
                <p>Type any name in the search bar to create a new page instantly.</p>
              </div>
            ) : (
              <ul className="shortcut-list list-none p-0">
                {[
                  { k: 'E', t: 'Edit Page', d: 'Toggle editor mode.', i: 'ph-pencil-simple' },
                  { k: 'S', t: 'Search Pages', d: 'Focus the navigation bar.', i: 'ph-magnifying-glass' },
                  { k: 'C', t: 'Copy Content', d: 'Copy text to clipboard.', i: 'ph-copy-simple' },
                  { k: 'L', t: 'Copy Link', d: "Copy page URL.", i: 'ph-link-simple-horizontal' },
                  { k: 'H', t: 'Go Home', d: 'Return to landing page.', i: 'ph-house-simple' },
                  { k: 'Q', t: 'QR Code', d: 'Show page QR.', i: 'ph-qr-code' }
                ].map((s, idx) => (
                  <li key={idx} className="shortcut-item mb-[25px] flex items-center gap-[15px]">
                    <div className="icon-container bg-gray-50 rounded-[8px] p-[10px] shrink-0">
                      <i className={`ph-bold ${s.i} text-[24px] text-[#4e4e4e]`}></i>
                    </div>
                    <div>
                      <h3 className="m-0 mb-[5px] text-[18px] font-medium text-[#111]">
                        {s.t} <span className="ml-2 bg-[#eee] px-2 py-0.5 rounded text-sm">{s.k}</span>
                      </h3>
                      <p className="m-0 text-[#555]">{s.d}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="text-center py-10">
          <button onClick={() => setPathPage('home')} className="hover:scale-110 transition-transform">
            <i className="ph-bold ph-bird text-[32px] text-indigo-600"></i>
          </button>
        </div>
      </div>
    );
  }

  if (isHome) {
    return (
      <div className="h-screen w-screen flex flex-col justify-center items-center bg-white">
        <Toast 
          message={toast.message} 
          isVisible={toast.isVisible} 
          onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} 
        />
        
        <div className="container max-w-[500px] w-[90%] text-center">
          <div className="flex items-center justify-center gap-[10px] mb-[10px] cursor-pointer group" onClick={() => setPathPage('home')}>
            <i className="ph-bold ph-bird text-[60px] text-indigo-600 group-hover:scale-110 transition-transform"></i>
            <h1 className="text-[2rem] font-medium m-0">qkrsai pages</h1>
          </div>
          <p className="font-light text-[1rem] mb-[30px] text-gray-400">Share text in real time with a simple path.</p>
          
          <form onSubmit={handleSearchSubmit} className="flex flex-col items-center gap-[10px] w-full">
            <input
              ref={homeSearchRef}
              type="text"
              autoFocus
              value={searchValue}
              onChange={(e) => setSearchValue(sanitizePageName(e.target.value))}
              placeholder="Type page name + Enter ⏎"
              className="w-full py-[14px] px-[18px] text-[1.2rem] rounded-[12px] border-2 border-[#ccc] outline-none transition-all focus:border-indigo-600"
            />
            
            <div className="text-[0.9rem] text-[#ccc] mt-[50px] flex flex-wrap justify-center gap-4">
              <button onClick={() => setPathPage('x-about')} className="hover:underline hover:text-indigo-600">About</button>
              <button onClick={() => setPathPage('x-shortcuts')} className="hover:underline hover:text-indigo-600">Shortcuts</button>
              <button onClick={() => setPathPage(generateRandomPage())} className="hover:underline hover:text-indigo-600">Random</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pb-32 max-w-4xl mx-auto px-6 pt-8">
      <Toast 
        message={toast.message} 
        isVisible={toast.isVisible} 
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} 
      />

      <div className="mb-8 flex items-center gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1">
          <input
            ref={searchRef}
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(sanitizePageName(e.target.value))}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            placeholder={`${page}`}
            className={`
              w-full py-4 px-6 rounded-2xl bg-white border border-gray-200 shadow-sm
              transition-all text-lg font-medium outline-none
              ${isSearchFocused ? 'ring-4 ring-indigo-500/10 border-indigo-500 shadow-md' : 'hover:border-gray-300'}
            `}
          />
        </form>
      </div>

      <main className="flex-1 w-full bg-white border border-gray-200 rounded-3xl shadow-sm p-8 md:p-12 min-h-[60vh] relative">
        {mode === 'edit' ? (
          <textarea
            ref={editorRef}
            value={content}
            onChange={handleContentChange}
            placeholder="Start typing..."
            className="w-full h-full min-h-[50vh] resize-none bg-transparent text-lg leading-relaxed mono"
          />
        ) : (
          <div className="w-full h-full text-lg leading-relaxed whitespace-pre-wrap break-words">
            {content ? formatContent(content) : (
              <div className="flex flex-col items-center justify-center h-full opacity-20 py-20">
                <i className="ph ph-note-pencil text-8xl mb-4"></i>
                <p className="text-xl font-medium">Press E to edit</p>
              </div>
            )}
          </div>
        )}
      </main>

      <Toolbar 
        mode={mode} 
        toggleMode={() => setMode(m => m === 'view' ? 'edit' : 'view')}
        onHome={() => setPathPage('home')}
        onCopy={async () => {
          if (await copyToClipboard(content)) showToast('Content copied');
        }}
        onCopyLink={async () => {
          if (await copyToClipboard(getCurrentURL())) showToast('Link copied');
        }}
        onSearch={() => searchRef.current?.focus()}
        onQR={() => setIsQRModalOpen(true)}
      />

      <QRModal isOpen={isQRModalOpen} onClose={() => setIsQRModalOpen(false)} />
    </div>
  );
};

export default App;
