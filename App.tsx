
import React, { useState, useEffect, useRef } from 'react';
import { Mode } from './types';
import { getPageFromHash, setHashPage, copyToClipboard, getCurrentURL, sanitizePageName, generateRandomPage } from './utils/path';
import { formatContent } from './utils/formatter';
import { subscribeToPage, updatePageContent } from './services/firebase';
import Toolbar from './components/Toolbar';
import QRModal from './components/QRModal';
import Toast from './components/Toast';

const App: React.FC = () => {
  const [page, setPage] = useState<string>(getPageFromHash());
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

  // Sync with URL Hash
  useEffect(() => {
    const handleHashChange = () => {
      const newPage = getPageFromHash();
      setPage(newPage);
      setMode('view');
      
      // Clear search and blur inputs after navigation
      setSearchValue('');
      searchRef.current?.blur();
      homeSearchRef.current?.blur();
      
      setError(null);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
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

  // Handle Mode Change Focus
  useEffect(() => {
    if (mode === 'edit' && editorRef.current) {
      editorRef.current.focus();
    }
    window.scrollTo(0, 0);
  }, [mode]);

  // Debounced Save
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
      const isInput = ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName);

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
        setHashPage('home');
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
      setHashPage(searchValue.trim());
      // Input will be cleared and blurred by the hashchange listener
    }
  };

  // Render Special Pages (About / Shortcuts)
  if (isSpecial) {
    const isAbout = page === 'x-about';
    const isShortcuts = page === 'x-shortcuts';

    return (
      <div className="min-h-screen bg-white flex flex-col text-[#111]">
        <div className="max-w-[700px] w-full mx-auto px-5 pt-10 flex-grow">
          <h1 className="text-[28px] font-medium mb-[30px] border-b-2 border-[#ccc] pb-[10px] flex items-center gap-[10px]">
            {isAbout ? (
              <i className="ph-bold ph-info text-[28px]"></i>
            ) : (
              <i className="ph-bold ph-command text-[28px]"></i>
            )}
            {isAbout ? 'About qkrsai' : 'Keyboard Shortcuts'}
          </h1>
          
          <div className="w-full text-[#555] leading-[1.6]">
            {isAbout ? (
              <div className="space-y-6 text-base">
                <p>qkrsai is a minimalist, real-time interactive editor designed for fast text sharing and collaborative notes.</p>
                <p>Just type a page name in the URL or the home search to create a new page instantly. Your changes are saved automatically and synchronized across all devices in real-time.</p>
                <h2 className="text-[22px] font-medium text-[#111] mt-10 mb-4">Features</h2>
                <ul className="list-disc pl-5 space-y-3">
                  <li>Real-time multi-user editing</li>
                  <li>Automatic link detection (URLs, emails, phones)</li>
                  <li>Slash-path internal links (e.g., /notes/project)</li>
                  <li>Instant QR code generation for mobile sharing</li>
                  <li>Privacy by obscurity — choose a unique path</li>
                </ul>
              </div>
            ) : (
              <ul className="shortcut-list list-none p-0">
                {[
                  { k: 'E', t: 'Edit Page', d: 'Jumps cursor to the editor. Your text saves automatically and updates in realtime.', i: 'ph-pencil-simple' },
                  { k: 'S', t: 'Search Pages', d: 'Opens the search bar at the top for quick page navigation.', i: 'ph-magnifying-glass' },
                  { k: 'C', t: 'Copy Content', d: 'Copies all visible text content on the current page to your clipboard.', i: 'ph-copy-simple' },
                  { k: 'L', t: 'Copy Link', d: "Copies the current page's URL to your clipboard for instant sharing.", i: 'ph-link-simple-horizontal' },
                  { k: 'H', t: 'Go Home', d: 'Navigates directly back to the root /home page. It may also be a duck.', i: 'ph-house-simple' },
                  { k: 'Q', t: 'QR Code', d: 'Shows or hides the QR code for the page.', i: 'ph-qr-code' },
                  { k: 'Esc', t: 'Escape', d: 'Leaves the editor, search bar, or QR code modal.', i: 'ph-x-circle' }
                ].map((s, idx) => (
                  <li key={idx} className="shortcut-item mb-[25px] flex items-center gap-[15px]">
                    <div className="icon-container bg-white rounded-[8px] p-[10px] flex items-center justify-center shrink-0">
                      <i className={`ph-bold ${s.i} text-[24px] text-[#4e4e4e]`}></i>
                    </div>
                    <div className="shortcut-content flex-1 text-[16px]">
                      <h3 className="m-0 mb-[5px] text-[18px] font-medium text-[#111] flex items-center gap-2">
                        {s.t} <span className="shortcut bg-[#eee] text-[#111] font-mono font-semibold text-[0.9em] px-[7px] py-[2px] rounded-[4px] inline-flex items-center line-height-[1.2] relative -top-[1px]">{s.k}</span>
                      </h3>
                      <p className="m-0 text-[#555] leading-[1.5]">{s.d}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div id="pageFooter" className="text-center py-10 mt-10">
          <a href="#/home" onClick={(e) => { e.preventDefault(); setHashPage('home'); }}>
            <i className="ph-bold ph-bird text-[32px] text-indigo-600 block mx-auto mb-[15px] hover:scale-110 transition-transform"></i>
          </a>
        </div>
      </div>
    );
  }

  // Render Landing Page
  if (isHome) {
    return (
      <div className="h-screen w-screen flex flex-col justify-center items-center bg-white text-[#4e4e4e]">
        <Toast 
          message={toast.message} 
          isVisible={toast.isVisible} 
          onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} 
        />
        
        <div className="container max-w-[500px] w-[90%] text-center">
          <div className="title-container flex items-center justify-center gap-[10px] mb-[10px] cursor-pointer group" onClick={(e) => { e.preventDefault(); setHashPage('home'); }}>
            <i className="ph-bold ph-bird text-[60px] text-indigo-600 group-hover:scale-110 transition-transform"></i>
            <h1 className="text-[2rem] font-medium m-0">qkrsai</h1>
          </div>
          <p className="description font-light text-[1rem] mb-[30px]">Share text in real time with a simple link.</p>
          
          <form onSubmit={handleSearchSubmit} className="flex flex-col items-center gap-[10px] w-full">
            <input
              ref={homeSearchRef}
              type="text"
              autoFocus
              value={searchValue}
              onChange={(e) => setSearchValue(sanitizePageName(e.target.value))}
              placeholder="Type page name + Enter ⏎"
              className="w-full py-[14px] px-[18px] text-[1.2rem] rounded-[12px] border-2 border-[#ccc] outline-none transition-all focus:border-indigo-600 font-sans"
            />
            
            <div className="hint text-[0.9rem] text-[#ccc] mt-[50px] flex flex-wrap justify-center gap-[10px]">
              <a 
                href="#/x/about" 
                onClick={(e) => { e.preventDefault(); setHashPage('x-about'); }}
                className="text-inherit no-underline cursor-pointer px-[15px] py-[10px] hover:underline hover:text-indigo-600 transition-colors"
              >
                About
              </a>
              <a 
                href="#/x/shortcuts" 
                onClick={(e) => { e.preventDefault(); setHashPage('x-shortcuts'); }}
                className="text-inherit no-underline cursor-pointer px-[15px] py-[10px] hover:underline hover:text-indigo-600 transition-colors"
              >
                Shortcuts
              </a>
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); setHashPage(generateRandomPage()); }}
                className="text-inherit no-underline cursor-pointer px-[15px] py-[10px] hover:underline hover:text-indigo-600 transition-colors"
              >
                Random Page
              </a>
              <a href="mailto:support@qkrsai.dev" className="text-inherit no-underline cursor-pointer px-[15px] py-[10px] hover:underline hover:text-indigo-600 transition-colors">Email Us</a>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Render Standard Page
  return (
    <div className="min-h-screen flex flex-col pb-32 max-w-4xl mx-auto px-6 pt-8">
      <Toast 
        message={toast.message} 
        isVisible={toast.isVisible} 
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} 
      />

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top duration-300">
          <i className="ph ph-warning-circle text-2xl mt-0.5"></i>
          <div className="flex-1">
            <p className="text-sm font-semibold mb-1">Database Access Issue</p>
            <p className="text-xs opacity-90">{error}</p>
          </div>
        </div>
      )}

      <div className="mb-8 flex items-center gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
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

      <main className="flex-1 w-full bg-white border border-gray-200 rounded-3xl shadow-sm p-8 md:p-12 min-h-[60vh] relative overflow-hidden">
        {mode === 'edit' ? (
          <textarea
            ref={editorRef}
            id="editor"
            value={content}
            onChange={handleContentChange}
            placeholder="Start typing... Use /page to connect pages."
            className="w-full h-full min-h-[50vh] resize-none bg-transparent text-lg leading-relaxed mono focus:outline-none placeholder:opacity-30"
          />
        ) : (
          <div className="w-full h-full text-lg leading-relaxed whitespace-pre-wrap break-words no-scrollbar">
            {content ? formatContent(content) : (
              <div className="flex flex-col items-center justify-center h-full opacity-20 py-20 pointer-events-none">
                <i className="ph ph-note-pencil text-8xl mb-4"></i>
                <p className="text-xl font-medium italic">Empty page. Press E to edit.</p>
              </div>
            )}
          </div>
        )}
      </main>

      <Toolbar 
        mode={mode} 
        toggleMode={() => setMode(m => m === 'view' ? 'edit' : 'view')}
        onHome={() => setHashPage('home')}
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
