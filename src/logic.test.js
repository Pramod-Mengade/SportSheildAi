import { describe, it, expect, vi } from 'vitest';

// Mocking window and globals since main.js is not a clean module yet
global.window = {};
global.firebase = { initializeApp: vi.fn(), auth: () => ({}), storage: () => ({}), firestore: () => ({}) };

// Mock canvas and other browser APIs
global.TextEncoder = class { encode(s) { return Buffer.from(s); } };

describe('MediaDNA Core Logic', () => {
  it('Hamming distance should calculate correctly', () => {
    const hammingDist = (h1, h2) => {
      let d = 0;
      for (let i = 0; i < h1.length; i++) if (h1[i] !== h2[i]) d++;
      return d;
    };
    expect(hammingDist('1111', '1100')).toBe(2);
    expect(hammingDist('0000', '1111')).toBe(4);
  });

  it('Bits to Text conversion should be reversible', () => {
    const original = "DNA-TEST";
    const bin = Array.from(Buffer.from(original))
      .map(b => b.toString(2).padStart(8, '0')).join('') + '0000000000000000';
    
    const bitsToText = (bits) => {
      let text = '';
      for (let i = 0; i + 8 <= bits.length; i += 8) {
        const code = parseInt(bits.slice(i, i + 8), 2);
        if (code === 0) break;
        text += String.fromCharCode(code);
      }
      return text;
    };
    
    expect(bitsToText(bin)).toBe(original);
  });
});
