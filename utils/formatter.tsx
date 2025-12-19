
import React from 'react';

/**
 * Robust formatter that converts plain text into clickable elements.
 * Uses a single-pass scanning approach to handle overlapping patterns correctly.
 */

interface MatchResult {
  index: number;
  length: number;
  text: string;
  type: 'url' | 'nakedUrl' | 'email' | 'phone' | 'path';
  href: string;
}

export const formatContent = (content: string): React.ReactNode[] => {
  if (!content) return [];

  const lines = content.split('\n');

  return lines.map((line, lineIndex) => {
    if (!line.trim()) return <div key={lineIndex} className="h-[1.5em]"><br /></div>;

    const matches: MatchResult[] = [];

    // 1. Full Protocol URLs (http, https)
    const urlRegex = /https?:\/\/[^\s/$.?#].[^\s]*/gi;
    for (const m of line.matchAll(urlRegex)) {
      matches.push({
        index: m.index!,
        length: m[0].length,
        text: m[0],
        type: 'url',
        href: m[0]
      });
    }

    // 2. tel: protocol links
    const telProtocolRegex = /tel:\+?[0-9]{1,15}/gi;
    for (const m of line.matchAll(telProtocolRegex)) {
      matches.push({
        index: m.index!,
        length: m[0].length,
        text: m[0],
        type: 'phone',
        href: m[0]
      });
    }

    // 3. Emails
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
    for (const m of line.matchAll(emailRegex)) {
      matches.push({
        index: m.index!,
        length: m[0].length,
        text: m[0],
        type: 'email',
        href: `mailto:${m[0]}`
      });
    }

    // 4. Naked Domains (qk.rs, qk.rs/info, a.qk.rs)
    const nakedUrlRegex = /(?:^|\s)((?:[a-zA-Z0-9-]+\.)+[a-z]{2,}(?:\/[^\s]*[^\s.,?!])?)/gi;
    for (const m of line.matchAll(nakedUrlRegex)) {
      const fullMatch = m[0];
      const capture = m[1];
      const captureIndex = m.index! + fullMatch.indexOf(capture);
      matches.push({
        index: captureIndex,
        length: capture.length,
        text: capture,
        type: 'nakedUrl',
        href: `https://${capture}`
      });
    }

    // 5. Phone Numbers (Broad support for local and international)
    const phoneRegex = /(?:^|\s)(\+?\(?\d{1,4}\)?(?:[\s.-]?\(?\d{1,4}\)?){1,5}(?:[\s.-]?\d{1,10}){1,5})/g;
    for (const m of line.matchAll(phoneRegex)) {
      const fullMatch = m[0];
      const capture = m[1];
      const captureIndex = m.index! + fullMatch.indexOf(capture);
      const digitsOnly = capture.replace(/[^\d]/g, '');
      
      const hasSeparator = /[\s.-]/.test(capture);
      if (digitsOnly.length >= 7 && digitsOnly.length <= 15) {
          if (digitsOnly.length < 10 || hasSeparator || capture.startsWith('+')) {
            matches.push({
              index: captureIndex,
              length: capture.length,
              text: capture,
              type: 'phone',
              href: `tel:${capture.replace(/[^\d+]/g, '')}`
            });
          }
      }
    }

    // 6. Slash paths (/home, /a/b/c)
    // CRITICAL FIX: Escaped the forward slash inside the character class [\/]
    const pathRegex = /(?:^|\s)(\/[a-zA-Z0-9\-_\\/]+)/g;
    for (const m of line.matchAll(pathRegex)) {
      const fullMatch = m[0];
      const capture = m[1];
      const captureIndex = m.index! + fullMatch.indexOf(capture);
      matches.push({
        index: captureIndex,
        length: capture.length,
        text: capture,
        type: 'path',
        href: `#${capture}`
      });
    }

    // Filter and sort matches to handle overlaps (Keep earliest/longest)
    const sortedMatches = matches.sort((a, b) => a.index - b.index || b.length - a.length);
    const filteredMatches: MatchResult[] = [];
    let lastMatchEnd = -1;

    for (const m of sortedMatches) {
      if (m.index >= lastMatchEnd) {
        filteredMatches.push(m);
        lastMatchEnd = m.index + m.length;
      }
    }

    // Build the final line parts
    const parts: React.ReactNode[] = [];
    let currentIndex = 0;

    for (const m of filteredMatches) {
      // Add plain text before match
      if (m.index > currentIndex) {
        parts.push(line.substring(currentIndex, m.index));
      }

      // Add clickable element
      const isInternal = m.type === 'path';
      parts.push(
        <a
          key={`${lineIndex}-${m.index}`}
          href={m.href}
          target={isInternal ? undefined : "_blank"}
          rel={isInternal ? undefined : "noopener noreferrer"}
          className={`text-indigo-600 hover:text-indigo-700 hover:underline break-all transition-colors ${m.type === 'path' ? 'font-medium underline underline-offset-4 decoration-indigo-200 hover:decoration-indigo-600' : ''} ${m.type === 'phone' ? 'whitespace-nowrap' : ''}`}
        >
          {m.text}
        </a>
      );

      currentIndex = m.index + m.length;
    }

    // Add remaining plain text
    if (currentIndex < line.length) {
      parts.push(line.substring(currentIndex));
    }

    return (
      <div key={lineIndex} className="min-h-[1.5em]">
        {parts}
      </div>
    );
  });
};
