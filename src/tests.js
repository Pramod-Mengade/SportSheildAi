/**
 * MediaDNA AI — Diagnostic Test Suite
 * Validates core logic: DNA steganography, fingerprinting, and API connectivity.
 */

window.runDiagnostics = async function runDiagnostics() {
  const results = [];
  const log = (name, status, details = '') => results.push({ name, status, details });

  notify('🚀 Starting System Diagnostics...', 'info');

  // TEST 1: DNA Conversion Logic
  try {
    const originalText = JSON.stringify({ id: 'test-123', org: 'BCCI' });
    // Simulate textToBits (from embedDNA)
    const bin = Array.from(new TextEncoder().encode(originalText))
      .map(b => b.toString(2).padStart(8, '0')).join('') + '0000000000000000';
    
    const decodedText = bitsToText(bin);
    if (decodedText === originalText) {
      log('DNA Logic', 'PASS', 'Binary encoding/decoding verified.');
    } else {
      log('DNA Logic', 'FAIL', 'Decoded text mismatch.');
    }
  } catch (e) {
    log('DNA Logic', 'ERROR', e.message);
  }

  // TEST 2: Hamming Distance
  try {
    const h1 = "11110000";
    const h2 = "11110011"; // 2 bits different
    const dist = hammingDist(h1, h2);
    if (dist === 2) {
      log('Fingerprint Logic', 'PASS', 'Hamming distance calculation correct.');
    } else {
      log('Fingerprint Logic', 'FAIL', `Expected 2, got ${dist}`);
    }
  } catch (e) {
    log('Fingerprint Logic', 'ERROR', e.message);
  }

  // TEST 3: Backend Health Check
  try {
    const resp = await fetch('/api/health');
    const data = await resp.json();
    if (resp.ok && data.ok) {
      log('Backend API', 'PASS', `Healthy (v${data.version})`);
    } else {
      log('Backend API', 'FAIL', 'Health check failed.');
    }
  } catch (e) {
    log('Backend API', 'ERROR', 'Could not reach server proxy.');
  }

  // TEST 4: API Key Verification
  try {
    const resp = await fetch('/api/health');
    const data = await resp.json();
    const missing = [];
    if (!data.keys.gemini) missing.push('Gemini');
    if (!data.keys.vision) missing.push('Vision');
    
    if (missing.length === 0) {
      log('API Config', 'PASS', 'All required API keys are active.');
    } else {
      log('API Config', 'WARN', `Missing keys: ${missing.join(', ')}`);
    }
  } catch (e) {
    log('API Config', 'ERROR', 'Could not verify keys.');
  }

  // TEST 5: Steganography Buffer
  try {
    const testCanvas = document.createElement('canvas');
    testCanvas.width = 10; testCanvas.height = 10;
    const ctx = testCanvas.getContext('2d');
    const imgData = ctx.getImageData(0,0,10,10);
    if (imgData.data.length === 400) {
      log('Canvas Engine', 'PASS', 'Browser canvas manipulation active.');
    } else {
      log('Canvas Engine', 'FAIL', 'Unexpected canvas data size.');
    }
  } catch (e) {
    log('Canvas Engine', 'ERROR', e.message);
  }

  renderDiagnosticResults(results);
};

function renderDiagnosticResults(results) {
  const container = $('diagnostic-results');
  if (!container) return;

  container.innerHTML = `
    <div class="card" style="margin-top:20px; animation: slideUp 0.4s ease;">
      <div class="section-hdr">🛠️ Diagnostic Report</div>
      <table style="width:100%; border-collapse: collapse; font-size:13px">
        <thead>
          <tr style="text-align:left; border-bottom:1px solid var(--border2)">
            <th style="padding:10px">Test Component</th>
            <th style="padding:10px">Status</th>
            <th style="padding:10px">Details</th>
          </tr>
        </thead>
        <tbody>
          ${results.map(r => `
            <tr style="border-bottom:1px solid var(--border)">
              <td style="padding:10px; font-weight:600">${r.name}</td>
              <td style="padding:10px">
                <span class="badge ${r.status === 'PASS' ? 'b-green' : r.status === 'WARN' ? 'b-gold' : 'b-red'}">
                  ${r.status}
                </span>
              </td>
              <td style="padding:10px; color:var(--muted)">${r.details}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div style="margin-top:20px; text-align:center; font-size:12px; color:var(--muted)">
        ${results.every(r => r.status === 'PASS') ? '✅ All systems operational.' : '⚠️ Some components require attention.'}
      </div>
    </div>
  `;
}
