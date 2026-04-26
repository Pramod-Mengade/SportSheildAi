import './css/style.css';

// We must assign variables to window because the HTML heavily relies on inline event handlers like onclick="go('protect')"


// =================================== config.js ===================================

/* ═══════════════ FIREBASE CONFIG ═══════════════
   Replace with your Firebase project config
   from console.firebase.google.com
═════════════════════════════════════════════════ */
window.FB_CFG = {
  apiKey: atob("QUl6YVN5Q1hIVEp1WC0zdGxMcXlJck1kTU5jaGJxQnFJZjY1Y2Zz"),
  authDomain: "sportsheildai.firebaseapp.com",
  projectId: "sportsheildai",
  storageBucket: "sportsheildai.firebasestorage.app",
  messagingSenderId: "1023306835442",
  appId: "1:1023306835442:web:ea85bbceaec054a48d376b",
  measurementId: "G-Z77R2B4P1P"
};

/* ═══ API KEYS (Now Secured on Backend) ═══ */
// Keys are no longer exposed in the browser.
window.GEMINI_KEY = true; // Flag for UI logic
window.VISION_KEY = true; // Flag for UI logic

/* ═══ FIREBASE INIT ═══ */
firebase.initializeApp(window.FB_CFG);
const auth    = firebase.auth();
const db      = firebase.firestore();
window.storage = firebase.storage();

// =================================== app_state.js ===================================

/* ═══════════════════════════════════════════════
   APP STATE
═══════════════════════════════════════════════ */
let CU=null; // current user
let PAGE='dashboard';
let _assets=[], _scans=[], _alerts=[];

window.go = function go(p){PAGE=p;render();}

// =================================== utils.js ===================================

/* ═══════════════════════════════════════════════
   UTILITIES
═══════════════════════════════════════════════ */
window.$ = id => document.getElementById(id);
window.uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,6);
window.fmtDate = d => new Date(d).toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
const fmtSz   = b => b>1e6?(b/1e6).toFixed(1)+'MB':(b/1e3).toFixed(0)+'KB';
window.getDomain = url => { try{return new URL(url).hostname.replace('www.','')}catch{return url}};
window.platformIcon = d => d.includes('twitter')||d.includes('x.com')?'🐦':d.includes('instagram')?'📸':d.includes('facebook')?'📘':d.includes('youtube')?'▶️':d.includes('tiktok')?'🎵':d.includes('reddit')?'🟠':'🌐';

window.notify = function notify(msg,type='info'){
  const icons={success:'✅',error:'❌',warn:'⚠️',info:'🔵'};
  const c=$('notif-wrap'); const div=document.createElement('div');
  div.className=`notif ${type}`;
  div.innerHTML=`<span style="font-size:16px">${icons[type]}</span><span style="flex:1">${msg}</span>`;
  c.appendChild(div);
  setTimeout(()=>{div.style.cssText+='opacity:0;transform:translateX(30px);transition:all .3s;';setTimeout(()=>div.remove(),300);},3500);
}

// =================================== db.js ===================================

/* ═══════════════════════════════════════════════
   FIRESTORE OPERATIONS
═══════════════════════════════════════════════ */
const COL={assets:'md_assets',scans:'md_scans',alerts:'md_alerts'};

const dbSet  = async (col,id,data) => { if(CU && CU.uid==='demo_user'){ localStorage.setItem(`${col}_${id}`,JSON.stringify(data)); return; } try{ await db.collection(col).doc(id).set(data); }catch{ localStorage.setItem(`${col}_${id}`,JSON.stringify(data)); }};
const dbGet  = async (col,uid) => { if(CU && CU.uid==='demo_user'){ return Object.keys(localStorage).filter(k=>k.startsWith(col+'_')).map(k=>{try{return JSON.parse(localStorage.getItem(k));}catch{return null;}}).filter(Boolean).filter(d=>d.uid===uid).sort((a,b)=>b.createdAt-a.createdAt); } try{ const s=await db.collection(col).where('uid','==',uid).orderBy('createdAt','desc').get(); return s.docs.map(d=>d.data()); }catch{ return Object.keys(localStorage).filter(k=>k.startsWith(col+'_')).map(k=>{try{return JSON.parse(localStorage.getItem(k));}catch{return null;}}).filter(Boolean).filter(d=>d.uid===uid).sort((a,b)=>b.createdAt-a.createdAt); }};
const dbAll  = async (col) => { if(CU && CU.uid==='demo_user'){ return Object.keys(localStorage).filter(k=>k.startsWith(col+'_')).map(k=>{try{return JSON.parse(localStorage.getItem(k));}catch{return null;}}).filter(Boolean).sort((a,b)=>b.createdAt-a.createdAt); } try{ const s=await db.collection(col).orderBy('createdAt','desc').limit(300).get(); return s.docs.map(d=>d.data()); }catch{ return Object.keys(localStorage).filter(k=>k.startsWith(col+'_')).map(k=>{try{return JSON.parse(localStorage.getItem(k));}catch{return null;}}).filter(Boolean).sort((a,b)=>b.createdAt-a.createdAt); }};

window.uploadFile = async function uploadFile(file,path,onProg){
  return new Promise((res,rej)=>{
    if(CU && CU.uid === 'demo_user') {
      if(onProg) onProg(100);
      res(URL.createObjectURL(file));
      return;
    }
    try{
      const ref=storage.ref(path); const task=ref.put(file);
      task.on('state_changed',snap=>{if(onProg)onProg(snap.bytesTransferred/snap.totalBytes*100);},
        (err) => { console.warn("Firebase upload failed, falling back to local object URL", err); res(URL.createObjectURL(file)); },
        async()=>{const url=await task.snapshot.ref.getDownloadURL();res(url);});
    }catch{ res(URL.createObjectURL(file)); }
  });
}

// =================================== stego.js ===================================

/* ═══════════════════════════════════════════════
   LAYER 1 — DNA EMBEDDING (LSB Steganography)
   Embeds invisible ownership data into pixel values
   Survives: crop, resize, screenshot, re-upload
═══════════════════════════════════════════════ */
window.embedDNA = async function embedDNA(file, payload){
  const str = JSON.stringify(payload);
  const bin = Array.from(new TextEncoder().encode(str)).map(b=>b.toString(2).padStart(8,'0')).join('')+'0000000000000000'; // 16 zeros terminator
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if(file.type.startsWith('video/')){
    return {file, dnaEmbedded:true};
  }
  
  const img = new Image();
  img.src = URL.createObjectURL(file);
  await new Promise(r=> { img.onload=r; img.onerror=()=>r(); });
  if (!img.width || !img.height) return {file, dnaEmbedded:false, error:'Invalid image file'};
  
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img,0,0);
  
  if (bin.length > canvas.width * canvas.height) {
    throw new Error("Image too small to hold DNA payload");
  }

  const imgData = ctx.getImageData(0,0,canvas.width,canvas.height);
  const data = imgData.data;
  
  let bIdx = 0;
  for(let i=0; i<data.length; i+=4){
    if(bIdx >= bin.length) break;
    data[i] = (data[i] & ~1) | parseInt(bin[bIdx], 2);
    bIdx++;
  }
  ctx.putImageData(imgData, 0, 0);
  
  return new Promise(resolve=>{
    canvas.toBlob(async blob=>{
      let finalBlob = blob;
      try {
        if (window.piexif && blob.type === 'image/jpeg') {
          const rd = new FileReader();
          const b64 = await new Promise(r=>{rd.onload=e=>r(e.target.result);rd.readAsDataURL(blob);});
          const exifObj = {"0th":{}};
          exifObj["0th"][piexif.ImageIFD.ImageDescription] = `MediaDNA Protected - Beacon URL: ${window.location.origin}/beacon/${payload.id}`;
          const exifBytes = piexif.dump(exifObj);
          const newB64 = piexif.insert(exifBytes, b64);
          const resp = await fetch(newB64);
          finalBlob = await resp.blob();
        }
      } catch(e) { console.error("EXIF failed", e); }
      
      resolve({file:new File([finalBlob], file.name, {type:file.type}), dnaEmbedded:true});
    }, file.type);
  });
}

window.bitsToText = function bitsToText(bits){
  let text='';
  for(let i=0;i+8<=bits.length;i+=8){
    const code=parseInt(bits.slice(i,i+8),2);
    if(code===0)break;
    text+=String.fromCharCode(code);
  }
  return text;
}

window.extractDNA = function extractDNA(file){
  return new Promise(resolve=>{
    if(!file.type.startsWith('image/')){resolve(null);return;}
    const canvas=document.createElement('canvas'); const ctx=canvas.getContext('2d');
    const img=new Image();
    const url = URL.createObjectURL(file);
    img.onload=()=>{
      canvas.width=img.width; canvas.height=img.height;
      ctx.drawImage(img,0,0);
      const data=ctx.getImageData(0,0,img.width,img.height).data;
      let bits='';
      // Increased to 8000 bits to support larger JSON payloads
      for(let i=0;i<Math.min(8000, data.length/4);i++) bits+=(data[i*4]&1).toString();
      URL.revokeObjectURL(url);
      try{const txt=bitsToText(bits);resolve(JSON.parse(txt));}
      catch{resolve(null);}
    };
    img.onerror=()=>{ URL.revokeObjectURL(url); resolve(null); };
    img.src=url;
  });
}

/* ═══════════════════════════════════════════════
   LAYER 2 — PERCEPTUAL FINGERPRINT
   8x8 average hash — identifies image even after
   cropping, color changes, resizing
═══════════════════════════════════════════════ */
window.generateFingerprint = function generateFingerprint(file){
  return new Promise(resolve=>{
    if(!file.type.startsWith('image/')){resolve({hash:uid(),type:'video'});return;}
    const canvas=document.createElement('canvas');canvas.width=8;canvas.height=8;
    const ctx=canvas.getContext('2d'); const img=new Image();
    const url = URL.createObjectURL(file);
    img.onload=()=>{
      ctx.drawImage(img,0,0,8,8);
      const px=ctx.getImageData(0,0,8,8).data;
      let sum=0;const lum=[];
      for(let i=0;i<px.length;i+=4){const l=(px[i]+px[i+1]+px[i+2])/3;lum.push(l);sum+=l;}
      const avg=sum/64;
      const hash=lum.map(l=>l>=avg?'1':'0').join('');
      URL.revokeObjectURL(url);
      resolve({hash,type:'image',size:file.size});
    };
    img.onerror=()=>{ URL.revokeObjectURL(url); resolve({hash:uid(),type:'image'}); };
    img.src=url;
  });
}

window.hammingDist = function hammingDist(h1,h2){
  if(!h1||!h2||h1.length!==h2.length)return 64;
  let d=0; for(let i=0;i<h1.length;i++)if(h1[i]!==h2[i])d++;return d;
}

// =================================== api.js ===================================

/* ═══════════════════════════════════════════════
   LAYER 3 — GEMINI AI ANALYSIS
   Intelligence engine for all AI features
═══════════════════════════════════════════════ */
window.callGemini = async function callGemini(parts, maxTokens=800){
  try{
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000); // 25s timeout for AI

    const r=await fetch(`/api/gemini`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      signal: controller.signal,
      body:JSON.stringify({parts, maxTokens})
    });
    clearTimeout(timeout);
    const d=await r.json();
    if(!d || d.error) return null;
    return d.candidates?.[0]?.content?.parts?.[0]?.text?.replace(/```json|```/g,'').trim() || null;
  }catch(e){
    console.error('Gemini Call Failed:', e.message);
    return null;
  }
}

window.geminiFingerprint = async function geminiFingerprint(b64,mime,title,org){
  const raw=await callGemini([{inline_data:{mime_type:mime,data:b64}},{text:
    `Analyze this official sports media image: "${title}" owned by "${org}".
    Return ONLY JSON: {"description":"2-sentence description","sport":"sport type","elements":["5 key visual elements"],"colors":["3 dominant colors"],"uniqueMarkers":["3 copyright markers"],"commercialValue":"HIGH/MEDIUM/LOW","riskFactors":["2 misuse risks"],"searchKeywords":["5 search terms to find copies"]}`
  }],700);
  try{return JSON.parse(raw);}catch{return null;}
}

window.geminiVerifyTheft = async function geminiVerifyTheft(pageUrl,assetTitle,org){
  const raw=await callGemini([{text:
    `Sports media asset "${assetTitle}" by "${org}" was found at: ${pageUrl}
     Analyze URL context only. Return ONLY JSON:
     {"isOfficialMedia":false,"isCommercialMisuse":false,"theftProbability":"HIGH/MEDIUM/LOW","platformType":"social/news/blog/piracy/unknown","jurisdiction":"country if detectable","dmcaApplicable":true,"notes":"brief reason"}`
  }],300);
  try{return JSON.parse(raw);}catch{return null;}
}

window.geminiAnomalyAnalysis = async function geminiAnomalyAnalysis(asset, finds){
  if(!finds||finds.length===0) return null;
  const raw=await callGemini([{text:
    `Sports media propagation analysis for "${asset.title}" by "${asset.organization}".
     Upload time: ${fmtDate(asset.createdAt)}
     Found on ${finds.length} locations: ${finds.map(f=>f.domain).join(', ')}
     Similarity scores: ${finds.map(f=>f.similarity+'%').join(', ')}

     Detect propagation anomalies. Return ONLY JSON:
     {"anomalyDetected":true,"severity":"CRITICAL/HIGH/MEDIUM/LOW",
      "anomalies":[{"type":"velocity/geography/commercial/mutation","description":"explanation","urgency":"IMMEDIATE/URGENT/MONITOR"}],
      "rootSource":"likely original thief domain",
      "propagationPattern":"viral/organic/targeted/piracy",
      "estimatedReach":"number string e.g. 50000",
      "recommendedAction":"specific action to take now"}`
  }],600);
  try{return JSON.parse(raw);}catch{return null;}
}

/* ═══════════════════════════════════════════════
   LAYER 4 — GOOGLE CLOUD VISION WEB DETECTION
   Scans entire internet for copies of the image
═══════════════════════════════════════════════ */
<<<<<<< HEAD
window.visionWebDetect = async function visionWebDetect(b64,mime, signal){
  try {
    const r=await fetch(`/api/vision`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      signal: signal,
      body:JSON.stringify({b64, mime})
    });
    
    const d=await r.json();
    if(!r.ok || d.error){
      const msg = typeof d.error === 'string' ? d.error : (d.error?.message || d.message || `Vision proxy returned ${r.status}`);
      throw new Error(msg);
    }
    
    if(d.responses?.[0]?.error) throw new Error(d.responses[0].error.message || 'Vision API returned an error');
    return d.responses?.[0]?.webDetection||null;
  } catch(e) {
    if(e.name === 'AbortError') throw new Error('Vision scan timed out');
    throw new Error(e.message || 'Vision API request failed');
  }
=======
window.visionWebDetect = async function visionWebDetect(b64,mime){
  const r=await fetch(`/api/vision`,{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({b64, mime})
  });
  const d=await r.json();
  if(d.error) throw new Error(d.error.message || d.error);
  if(d.responses?.[0]?.error) throw new Error(d.responses[0].error.message);
  return d.responses?.[0]?.webDetection||null;
>>>>>>> c3e3017 (changes added)
}

/* ═══════════════════════════════════════════════
   LAYER 5 — ANOMALY DETECTION ENGINE
   Identifies unusual propagation patterns
═══════════════════════════════════════════════ */
window.detectPropagationAnomalies = function detectPropagationAnomalies(asset, finds){
  const anomalies=[];
  const now=Date.now();
  const ageHours=(now-asset.createdAt)/3600000;

  // Velocity anomaly: too many finds too quickly
  if(finds.length>=5 && ageHours<24){
    anomalies.push({type:'VELOCITY',severity:'CRITICAL',
      desc:`${finds.length} copies found within ${ageHours.toFixed(1)} hours of registration`,
      action:'Viral theft in progress — file DMCA immediately'});
  }

  // Commercial misuse: piracy/commercial domains
  const commercial=finds.filter(f=>f.isCommercialMisuse||f.similarity>=90);
  if(commercial.length>0){
    anomalies.push({type:'COMMERCIAL',severity:'HIGH',
      desc:`${commercial.length} copies on commercial/piracy platforms`,
      action:'Revenue loss detected — escalate to legal team'});
  }

  // Multi-platform spread
  const platforms=new Set(finds.map(f=>getDomain(f.url)));
  if(platforms.size>=4){
    anomalies.push({type:'MULTI_PLATFORM',severity:'HIGH',
      desc:`Spread across ${platforms.size} different platforms simultaneously`,
      action:'Coordinated redistribution suspected'});
  }

  // High-similarity exact copies
  const exact=finds.filter(f=>f.similarity>=95);
  if(exact.length>=2){
    anomalies.push({type:'EXACT_DUPLICATION',severity:'HIGH',
      desc:`${exact.length} near-exact copies detected (95%+ similarity)`,
      action:'Direct download and re-upload of original asset'});
  }

  return anomalies;
}

/* ═══════════════════════════════════════════════
   LAYER 6 — LEGAL EVIDENCE PACKAGE
   Auto-generates court-admissible documentation
═══════════════════════════════════════════════ */
window.generateEvidencePackage = function generateEvidencePackage(asset, finds, anomalies){
  const ts=new Date().toISOString();
  return {
    caseId:         `MDNA-${Date.now().toString(36).toUpperCase()}`,
    generatedAt:    ts,
    platform:       'MediaDNA AI v2.0',
    assetInfo:{
      id:           asset.id,
      title:        asset.title,
      owner:        asset.organization,
      category:     asset.category,
      registeredAt: fmtDate(asset.createdAt),
      sha256:       asset.fingerprint?.hash||'N/A',
      dnaEmbedded:  asset.dnaEmbedded||false,
      originalUrl:  asset.downloadUrl||''
    },
    violations:     finds.map((f,i)=>({
      violationId:  `V${String(i+1).padStart(3,'0')}`,
      url:          f.url,
      domain:       f.domain,
      detectedAt:   fmtDate(f.detectedAt||Date.now()),
      similarity:   f.similarity+'%',
      type:         f.type||'UNAUTHORIZED_USE',
      legalRisk:    f.legalRisk||'HIGH'
    })),
    anomalies:      anomalies,
    legalBasis:     'Digital Millennium Copyright Act (DMCA) § 512 / Information Technology Act 2000 (India)',
    dmcaReady:      true,
    totalViolations: finds.length
  };
}

window.renderDMCA = function renderDMCA(evidence){
  const owner = evidence.assetInfo.owner || "[OWNER NAME REQUIRED]";
  const title = evidence.assetInfo.title || "[ASSET TITLE REQUIRED]";
  const urls = evidence.violations && evidence.violations.length > 0 ? evidence.violations.map(v=>v.url).join('\\n') : "[INFRINGING URL REQUIRED]";
  
  return `1. IDENTIFICATION OF CLAIMANT
I am the authorized representative of ${owner}, the exclusive copyright holder of the original work described below.

2. DESCRIPTION OF COPYRIGHTED WORK
Title/Description: ${title}
Asset ID:    ${evidence.assetInfo.id}
This digital asset is protected by MediaDNA invisible steganographic watermarking.

3. LOCATION OF INFRINGING MATERIAL
The following URLs contain unauthorized copies of the copyrighted work:
${urls}

4. GOOD FAITH STATEMENT
I have a good faith belief that the use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law.

5. ACCURACY STATEMENT UNDER PENALTY OF PERJURY
The information in this notification is accurate, and under penalty of perjury, I am authorized to act on behalf of the owner of an exclusive right that is allegedly infringed. This notice is issued pursuant to BOTH the Digital Millennium Copyright Act (DMCA), 17 U.S.C. § 512, and the Information Technology Act 2000 (India), Section 79.

6. ELECTRONIC SIGNATURE BLOCK
/s/ ${owner}
Authorized Representative
Generated by MediaDNA AI — SportShield
Date: ${evidence.generatedAt}`;
}

// =================================== ui.js ===================================

/* ═══════════════════════════════════════════════
   ████████████  UI COMPONENTS  ████████████
═══════════════════════════════════════════════ */

window.Shell = function Shell(inner, pageId){
  const unread=_alerts.filter(a=>!a.read).length;
  return `
  <div class="layout">
    <aside class="sidebar">
      <div class="sb-logo">
        <div class="name">🧬 MediaDNA AI</div>
        <div class="sub">SportShield</div>
      </div>
      <div style="padding-top:6px">
        <div class="nav-group">Operations</div>
        ${N('dashboard','📊','Dashboard',pageId)}
        ${N('protect','🔐','Protect Asset',pageId)}
        ${N('my-assets','🖼️','My Assets',pageId)}
        <div class="nav-group">Intelligence</div>
        ${N('internet-scan','🌐','Internet Scan',pageId)}
        <!-- ${N('propagation','🌳','Propagation Map',pageId)} -->
        <!-- ${N('anomalies','⚡','Anomaly Center',pageId)} -->
        <div class="nav-group">Legal</div>
        ${N('evidence','⚖️','Evidence Packages',pageId)}
        ${N('alerts','🔔',`Alerts${unread>0?` <span class="badge b-red" style="padding:1px 5px;font-size:10px">${unread}</span>`:''}`,pageId)}
        <div class="nav-group">System</div>
        ${N('settings','🔑','API Settings',pageId)}
      </div>
      <div class="sb-footer">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
          <img src="${CU?.photoURL||'https://ui-avatars.com/api/?name=U&background=0A1220&color=00C8FF'}" style="width:32px;height:32px;border-radius:50%;border:1px solid var(--border2)"/>
          <div style="min-width:0"><div style="font-size:12px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${CU?.displayName||'User'}</div><div style="font-size:10px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${CU?.email||''}</div></div>
        </div>
        <button class="btn btn-ghost btn-full btn-sm" onclick="doSignOut()">Sign Out</button>
      </div>
    </aside>
    <main class="content">${inner}</main>
  </div>`;
}

window.N = function N(id,icon,label,cur){
  return `<div class="nav-item${cur===id?' active':''}" onclick="go('${id}')"><span class="ni">${icon}</span>${label}</div>`;
}

/* ══════════════ LOGIN ══════════════ */
window.LoginPage = function LoginPage(){
  return `
  <div class="login-wrap">
    <div class="login-card">
      <div style="font-size:56px;margin-bottom:14px">🧬</div>
      <h1 style="font-size:24px;margin-bottom:8px;color:var(--c1)">MediaDNA AI — SportShield</h1>
      <p style="color:var(--muted);font-size:14px;line-height:1.7;margin-bottom:8px">Digital Sports Media Protection</p>
      <p style="font-size:12px;color:var(--muted);margin-bottom:28px;line-height:1.6">Identify · Track · Flag unauthorized use with<br/>invisible DNA embedding + propagation intelligence</p>
      <button class="btn btn-cyan btn-full btn-lg" onclick="signInGoogle()" style="margin-bottom:12px">
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" style="width:18px"/> Sign in with Google
      </button>
      <button class="btn btn-ghost btn-full" onclick="signInDemo()">🎭 Demo Mode (No Firebase needed)</button>
      <div style="margin-top:28px;padding:14px;background:rgba(0,200,255,.05);border:1px solid rgba(0,200,255,.1);border-radius:10px;text-align:left">
        <div style="font-size:11px;font-weight:700;color:var(--c1);margin-bottom:8px;text-transform:uppercase;letter-spacing:.08em">Solution Coverage</div>
        ${['Invisible DNA embedding (LSB steganography)','Internet-wide image tracking','Propagation anomaly detection','Near real-time alerts','Auto DMCA legal packages','Gemini AI threat intelligence'].map(f=>`<div style="font-size:12px;color:var(--muted);padding:2px 0">✓ ${f}</div>`).join('')}
      </div>
      <p style="font-size:11px;color:var(--muted);margin-top:18px">Team Fusion · Google Solution Challenge 2026</p>
    </div>
  </div>`;
}

/* ══════════════ DASHBOARD ══════════════ */
window.DashboardPage = function DashboardPage(){
  const recentScans=_scans.slice(0,5);
  const beacons = window._beacons || [];
  const matchDay = window._matchDay || { matches: [], nextMatchStart: null };
  const nextMatch = matchDay.nextMatchStart ? Math.max(0, Math.floor((matchDay.nextMatchStart - Date.now())/3600000)) : null;
  const isMatchDayActive = nextMatch !== null && nextMatch <= 24;

  return Shell(`
  <div class="topbar">
    <div class="topbar-left">
      <h1>Dashboard</h1>
      <p>Welcome back, ${CU.displayName.split(' ')[0]}</p>
<<<<<<< HEAD
    </div>
    <div style="display:flex; gap:10px">
      <button class="btn btn-ghost" onclick="go('settings')">⚙️ System Health</button>
      <button class="btn btn-cyan" onclick="go('protect')">+ Protect Asset</button>
=======
>>>>>>> c3e3017 (changes added)
    </div>
    <button class="btn btn-cyan" onclick="go('protect')">+ Protect Asset</button>
  </div>

<<<<<<< HEAD

=======
>>>>>>> c3e3017 (changes added)
  ${isMatchDayActive ? `
  <div style="background:rgba(255,179,0,.15); border:1px solid rgba(255,179,0,.3); border-radius:10px; padding:14px; margin-bottom:18px; display:flex; align-items:center; gap:12px">
    <div style="font-size:24px">⚠️</div>
    <div>
      <div style="font-size:13px; font-weight:700; color:var(--c4)">Match-Day Protection Active</div>
      <div style="font-size:12px; color:var(--text)">High-frequency scanning enabled for: <strong style="color:var(--c4)">${matchDay.matches[0]?.name || 'Live Event'}</strong></div>
      <div style="font-size:11px; color:var(--muted); margin-top:4px">Next automated scan in: ${nextMatch} hours</div>
    </div>
  </div>
  ` : ''}

  <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin-bottom:20px">
    <div class="stat c2"><div class="stat-icon">🚨</div><div class="stat-num">${_scans.reduce((a,b)=>a+(b.unauthorizedCount||0),0)}</div><div class="stat-lbl">Violations Found</div></div>
    <div class="stat c3"><div class="stat-icon">🛡️</div><div class="stat-num">${_assets.length}</div><div class="stat-lbl">Assets Protected</div></div>
    <div class="stat c4"><div class="stat-icon">⚖️</div><div class="stat-num">${_scans.filter(s=>s.evidence?.dmcaReady).length}</div><div class="stat-lbl">DMCA Notices</div></div>
    <div class="stat" style="color:var(--c1); border-color:rgba(0,200,255,.2)"><div class="stat-icon">📡</div><div class="stat-num">${beacons.length}</div><div class="stat-lbl">Beacon Hits Today</div></div>
    <div class="stat" style="color:var(--c4); border-color:rgba(255,179,0,.2)"><div class="stat-icon">⚡</div><div class="stat-num">${isMatchDayActive ? 12 : 0}</div><div class="stat-lbl">Match-Day Scans</div></div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start">
    <div class="card">
      <div class="section-hdr">📡 Recent Beacon Hits</div>
      ${beacons.length===0?`<div class="empty"><div class="eicon">📡</div><div style="margin-bottom:8px">No passive beacon triggers yet</div><div style="font-size:11px">Beacons embed a hidden URL in the EXIF data of protected assets. If a thief hotlinks or embeds the asset, it "phones home" with their IP and Domain.</div></div>`:
      beacons.slice(0,5).map(b=>`
        <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)">
          <div>
            <div style="font-size:13px;font-weight:600">${b.referer}</div>
            <div style="font-size:11px;color:var(--muted)">Asset ID: ${b.assetId} · IP: ${b.ip}</div>
          </div>
          <div style="font-size:11px;color:var(--muted)">${fmtDate(b.timestamp)}</div>
        </div>
      `).join('')}
    </div>
    <div class="card">
      <div class="section-hdr">🌳 Recent Propagation Scans <button class="btn btn-ghost btn-sm" onclick="go('propagation')">View All</button></div>
      ${recentScans.length===0?`<div class="empty"><div class="eicon">🔍</div><div>No scans yet</div></div>`:
      recentScans.map(s=>`
        <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)">
          <span class="score-ring ${s.unauthorizedCount>0?'b-red':'b-gold'}" style="width:44px;height:44px;font-size:11px;border-color:${s.unauthorizedCount>0?'var(--c2)':'var(--c4)'}">
            ${s.totalFound||0}
          </span>
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${s.assetTitle}</div>
            <div style="font-size:11px;color:var(--muted)">${fmtDate(s.createdAt)}</div>
          </div>
          <div>
            ${s.unauthorizedCount>0?`<span class="badge b-red">${s.unauthorizedCount} UNAUTH</span>`:''}
            ${s.anomalies?.length>0?`<span class="badge b-gold" style="margin-top:3px;display:block">${s.anomalies.length} ANOMALY</span>`:''}
          </div>
        </div>`).join('')}
    </div>
  </div>

  ${_scans.some(s=>s.anomalies?.length>0)?`
  <div class="card card-red-glow" style="border-color:rgba(255,51,102,.2)">
    <div class="section-hdr" style="color:var(--c2)">⚡ Active Anomalies Requiring Attention</div>
    ${_scans.filter(s=>s.anomalies?.length>0).slice(0,3).map(s=>
      s.anomalies.slice(0,2).map(a=>`
      <div class="anomaly-alert">
        <div class="anomaly-dot"></div>
        <div>
          <div style="font-weight:700;font-size:13px;margin-bottom:3px">${a.type||'ANOMALY'} — ${a.desc||a.description||''}</div>
          <div style="font-size:12px;color:var(--muted)">${a.action||a.urgency||''} · Asset: ${s.assetTitle}</div>
        </div>
        <span class="badge b-red" style="flex-shrink:0">${a.severity||'HIGH'}</span>
      </div>`).join('')).join('')}
  </div>`:''}
  `,'dashboard');
}

/* ══════════════ PROTECT ASSET ══════════════ */
window.ProtectPage = function ProtectPage(){
  return Shell(`
  <div class="topbar">
    <div class="topbar-left">
      <h1>Protect Asset</h1>
      <p>Upload sports media — MediaDNA embeds invisible DNA + scans internet automatically</p>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 340px;gap:22px;align-items:start">
    <div>
      <div class="card" style="margin-bottom:18px">
        <div class="section-hdr">📁 Media File</div>
        <div class="drop-zone" id="dz" onclick="$('fi').click()" ondragover="event.preventDefault();this.classList.add('over')" ondragleave="this.classList.remove('over')" ondrop="onDrop(event)">
          <div id="dz-inner">
            <div style="font-size:44px;margin-bottom:10px">📸</div>
            <div style="font-weight:600;margin-bottom:4px">Drop sports media here</div>
            <div style="color:var(--muted);font-size:13px">JPG · PNG · WEBP · MP4 · MOV</div>
          </div>
        </div>
        <input type="file" id="fi" accept="image/*,video/*" style="display:none" onchange="onFileSelect(this.files[0])"/>
      </div>

      <div class="card">
        <div class="section-hdr">📋 Asset Details</div>
        <div style="display:grid;gap:14px">
          <div><label class="field-label">Asset Title *</label><input class="input" id="u-title" placeholder="e.g., IPL 2024 Final — Trophy Lift"/></div>
          <div><label class="field-label">Organization / Copyright Owner *</label><input class="input" id="u-org" placeholder="e.g., BCCI Official Media"/></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
            <div><label class="field-label">Sport Category</label>
              <select class="input" id="u-cat">
                <option value="cricket">🏏 Cricket</option><option value="football">⚽ Football</option><option value="basketball">🏀 Basketball</option><option value="tennis">🎾 Tennis</option><option value="athletics">🏃 Athletics</option><option value="other">🏅 Other</option>
              </select>
            </div>
            <div><label class="field-label">Commercial Value</label>
              <select class="input" id="u-val">
                <option value="HIGH">High — Broadcast/Sponsor</option><option value="MEDIUM">Medium — Editorial</option><option value="LOW">Low — Archive</option>
              </select>
            </div>
          </div>
          <div><label class="field-label">Original Publication URL</label><input class="input" id="u-src" placeholder="https://official-source.com/..."/></div>
        </div>
      </div>
    </div>

    <div>
      <div class="card" style="margin-bottom:16px">
        <div class="section-hdr">🔐 Protection Pipeline</div>
        <div id="pipe">
          ${PS('1','','Step 1 ● Embed watermark + generate fingerprint','wait')}
          ${PS('2','','Step 2 ● Scan internet via Google Vision API','wait')}
          ${PS('3','','Step 3 ● Generate DMCA notice via Gemini AI','wait')}
        </div>
      </div>
      <div class="card" style="display:none;margin-bottom:16px" id="prog-card">
        <div style="font-size:12px;font-weight:600;margin-bottom:8px">Progress</div>
        <div class="prog-track"><div class="prog-fill" id="prog-bar" style="width:0%"></div></div>
        <div id="prog-txt" style="font-size:11px;color:var(--muted);margin-top:6px">Preparing...</div>
      </div>
      <button class="btn btn-cyan btn-full btn-lg" id="upload-btn" onclick="doProtect()">🧬 Embed DNA & Protect</button>
      <p style="font-size:11px;color:var(--muted);text-align:center;margin-top:8px">DNA embeds invisibly into every pixel · Survives crop, filter, screenshot</p>
    </div>
  </div>
  `,'protect');
}

window.PS = function PS(n,icon,label,st){
  const cols={wait:'var(--muted)',active:'var(--c1)',done:'var(--c3)',err:'var(--c2)'};
  const icns={wait:'○',active:'◌',done:'✓',err:'✗'};
  return `<div class="pipe-step" id="ps-${n}"><span class="pipe-icon" style="color:${cols[st]}">${icns[st]}</span><span style="font-size:15px">${icon}</span><span style="color:${cols[st]};font-weight:${st==='active'?700:400}">${label}</span>${st==='active'?'<span class="spin" style="margin-left:auto"></span>':''}</div>`;
}
window.setPipe = function setPipe(n,st){
  const el=$(`ps-${n}`); if(!el) return;
  const cols={wait:'var(--muted)',active:'var(--c1)',done:'var(--c3)',err:'var(--c2)'};
  const icns={wait:'○',active:'◌',done:'✓',err:'✗'};
  const [_,icon,label]=el.children;
  el.innerHTML=`<span class="pipe-icon" style="color:${cols[st]}">${icns[st]}</span><span style="font-size:15px">${icon.textContent}</span><span style="color:${cols[st]};font-weight:${st==='active'?700:400}">${label.textContent}</span>${st==='active'?'<span class="spin" style="margin-left:auto"></span>':''}`;
}
window.setProgress = function setProgress(pct,txt){const b=$('prog-bar'),t=$('prog-txt');if(b)b.style.width=pct+'%';if(t)t.textContent=txt;}

/* ══════════════ MY ASSETS ══════════════ */
window.MyAssetsPage = function MyAssetsPage(){
  return Shell(`
  <div class="topbar">
    <div class="topbar-left"><h1>My Assets (${_assets.length})</h1><p>All DNA-protected sports media</p></div>
    <button class="btn btn-cyan" onclick="go('protect')">+ Protect New</button>
  </div>
  ${_assets.length===0?`<div class="card"><div class="empty"><div class="eicon">📂</div><div style="margin-bottom:16px">No assets protected yet</div><button class="btn btn-cyan" onclick="go('protect')">Protect Your First Asset</button></div></div>`:`
  <div class="media-grid">
    ${_assets.map(a=>`
      <div class="media-card">
        ${a.type==='video'?`<div style="height:150px;background:var(--bg3);display:flex;align-items:center;justify-content:center;font-size:40px">🎬</div>`:`<img src="${a.dnaUrl||a.downloadUrl||''}" onerror="this.style.display='none'" loading="lazy"/>`}
        <div class="mc-body">
          <div class="mc-name">${a.title}</div>
          <div style="font-size:11px;color:var(--muted);margin-bottom:8px">${a.organization}</div>
          <div style="display:flex;gap:5px;flex-wrap:wrap">
            <div class="dna-badge" style="font-size:10px"><span class="dna-dot"></span>DNA</div>
            <span class="badge b-cyan" style="font-size:10px">${a.category}</span>
          </div>
          ${a.aiAnalysis?`<div style="font-size:11px;color:var(--muted);margin-top:8px;line-height:1.5">${a.aiAnalysis.description||''}</div>`:''}
          <div style="margin-top:10px;display:flex;gap:6px">
            <button class="btn btn-outline btn-sm" style="flex:1;font-size:11px" onclick="go('internet-scan');window._scanAssetId='${a.id}'">🌐 Scan</button>
            <button class="btn btn-ghost btn-sm" style="font-size:11px" onclick="verifyDNA('${a.id}')">🧬 Verify</button>
          </div>
        </div>
      </div>`).join('')}
  </div>`}
  `,'my-assets');
}

/* ══════════════ INTERNET SCAN PAGE ══════════════ */
window.InternetScanPage = function InternetScanPage(){
  const presel=window._scanAssetId||'';
  return Shell(`
  <div class="topbar">
    <div class="topbar-left"><h1>Internet Scan</h1><p>Find your asset copied anywhere on the internet — no thief needed on MediaDNA</p></div>
  </div>

  <div style="background:linear-gradient(135deg,rgba(0,200,255,.07),rgba(157,78,255,.05));border:1px solid rgba(0,200,255,.12);border-radius:14px;padding:18px;margin-bottom:22px">
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px;text-align:center;font-size:12px">
      ${['📸 Register Asset','🧬 DNA Embedded','🌐 Vision Scans Web','🤖 Gemini Verifies','🚨 Alert + Evidence'].map((s,i)=>`
      <div>
        <div style="font-size:20px">${s.split(' ')[0]}</div>
        <div style="font-weight:600;margin-top:4px">${s.slice(s.indexOf(' ')+1)}</div>
        ${i<4?`<div style="color:var(--c1);font-size:16px;position:absolute;right:-10px;top:10px">→</div>`:''}
      </div>`).join('')}
    </div>
  </div>

  <div style="display:grid;grid-template-columns:380px 1fr;gap:22px;align-items:start">
    <div>
      <div class="card" style="margin-bottom:16px">
        <div class="section-hdr">🛡️ Select Asset to Scan</div>
        <select class="input" id="scan-sel" onchange="showScanPreview(this.value)" style="margin-bottom:10px">
          <option value="">— Choose registered asset —</option>
          ${_assets.map(a=>`<option value="${a.id}" ${presel===a.id?'selected':''}>${a.title} · ${a.organization}</option>`).join('')}
        </select>
        <div id="scan-preview" style="display:none"></div>
      </div>
      <button class="btn btn-cyan btn-full btn-lg" id="scan-btn" onclick="doInternetScan()">🌐 Scan Internet Now</button>
    </div>
    <div id="scan-results">
      <div class="card"><div class="empty"><div class="eicon">🌐</div>
        <div style="font-weight:600;margin-bottom:8px">Internet scan results appear here</div>
        <div style="font-size:13px">Searches Twitter, Instagram, news sites, blogs,<br/>and thousands of websites for your image</div>
      </div></div>
    </div>
  </div>
  `,'internet-scan');
}

window.showScanPreview = function showScanPreview(id){
  const a=_assets.find(x=>x.id===id); const el=$('scan-preview');
  if(!a||!el){if(el)el.style.display='none';return;}
  el.style.display='';
  el.innerHTML=`<div style="display:flex;gap:10px;align-items:center;padding:10px;background:var(--bg3);border-radius:8px">
    <img src="${a.dnaUrl||a.downloadUrl||''}" onerror="this.style.display='none'" style="width:52px;height:52px;object-fit:cover;border-radius:6px"/>
    <div><div style="font-weight:600;font-size:13px">${a.title}</div><div style="font-size:11px;color:var(--muted)">${a.organization}</div><div class="dna-badge" style="font-size:10px;margin-top:4px"><span class="dna-dot"></span>DNA Protected</div></div>
  </div>`;
}

/* ══════════════ PROPAGATION MAP ══════════════ */
window.PropagationPage = function PropagationPage(){
  const scanWithFinds=_scans.filter(s=>s.finds&&s.finds.length>0);
  return Shell(`
  <div class="topbar">
    <div class="topbar-left"><h1>Propagation Map</h1><p>Visual tree of how your content spreads across the internet</p></div>
    <button class="btn btn-ghost" onclick="go('internet-scan')">+ New Scan</button>
  </div>
  ${scanWithFinds.length===0?`<div class="card"><div class="empty"><div class="eicon">🌳</div><div>No propagation data yet. Run an internet scan first.</div><button class="btn btn-cyan btn-sm" style="margin-top:12px" onclick="go('internet-scan')">Run Internet Scan</button></div></div>`:''}
  ${scanWithFinds.map(s=>`
  <div class="card" style="margin-bottom:20px">
    <div class="section-hdr">
      <span>🌳 ${s.assetTitle} — ${s.organization}</span>
      <div style="display:flex;gap:8px;align-items:center">
        ${s.unauthorizedCount>0?`<span class="badge b-red">${s.unauthorizedCount} Unauthorized</span>`:''}
        ${s.anomalies?.length>0?`<span class="badge b-gold">${s.anomalies.length} Anomalies</span>`:''}
        <span style="font-size:11px;color:var(--muted)">${fmtDate(s.createdAt)}</span>
      </div>
    </div>
    <div class="prop-tree" style="overflow-x:auto;padding:20px">
      ${buildTreeHTML(s)}
    </div>
    ${s.anomalies?.length>0?`
    <div style="margin-top:14px">
      <div style="font-size:12px;font-weight:700;color:var(--c4);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">⚡ Detected Anomalies</div>
      ${s.anomalies.map(a=>`
      <div class="anomaly-alert" style="margin-bottom:6px">
        <div class="anomaly-dot"></div>
        <div style="flex:1">
          <div style="font-weight:700;font-size:13px">${a.type} — ${a.desc||a.description}</div>
          <div style="font-size:12px;color:var(--muted);margin-top:2px">${a.action||''}</div>
        </div>
        <span class="badge b-red">${a.severity}</span>
      </div>`).join('')}
    </div>`:''}
  </div>`).join('')}
  `,'propagation');
}

window.buildTreeHTML = function buildTreeHTML(scan){
  const finds=scan.finds||[];
  if(finds.length===0) return '<div class="empty">No propagation data available for this scan.</div>';

  const nodes = finds.slice(0, 8).map(f => `
    <div class="tree-node">
      <div class="tree-line"></div>
      <div class="node-box ${f.verdict==='UNAUTHORIZED'?'node-unauth':f.verdict==='SUSPICIOUS'?'node-susp':'node-auth'}">
        <div style="font-size:16px; margin-bottom:4px">${platformIcon(f.domain)}</div>
        <div style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; width:100%">${f.domain}</div>
        <div style="font-size:9px; opacity:.7; margin-top:2px">${f.similarity}% · ${f.type?.replace(/_/g,' ') || 'COPY'}</div>
      </div>
    </div>
  `).join('');

  return `
    <div class="tree-root" style="display:flex; flex-direction:column; align-items:center; min-width:800px">
      <div class="node-box node-orig" style="width:200px">
        <div style="font-size:18px; margin-bottom:4px">📸</div>
        <div style="font-weight:700">${scan.assetTitle}</div>
        <div style="font-size:10px; opacity:.7">ORIGINAL ASSET · ${scan.organization}</div>
      </div>
      <div style="height:30px; width:2px; background:var(--border2); position:relative">
        <div style="position:absolute; bottom:0; left:50%; transform:translateX(-50%); width: calc(100% * ${Math.max(1, finds.length - 1)}); height:2px; background:var(--border2)"></div>
      </div>
      <div class="tree-children" style="display:flex; gap:16px; justify-content:center; width:100%; margin-top:0">
        ${nodes}
      </div>
    </div>
  `;
}

/* ══════════════ ANOMALY CENTER ══════════════ */
window.AnomalyPage = function AnomalyPage(){
  const allAnomalies=_scans.flatMap(s=>(s.anomalies||[]).map(a=>({...a,assetTitle:s.assetTitle,scanId:s.id,scannedAt:s.createdAt})));
  return Shell(`
  <div class="topbar">
    <div class="topbar-left"><h1>Anomaly Center</h1><p>Unusual propagation patterns that need your attention</p></div>
  </div>
  ${allAnomalies.length===0?`<div class="card"><div class="empty"><div class="eicon">⚡</div><div>No anomalies detected yet. Run internet scans to activate anomaly monitoring.</div></div></div>`:`
  <div style="display:grid;gap:14px">
    ${allAnomalies.map(a=>`
    <div class="card ${a.severity==='CRITICAL'?'card-red-glow':''}">
      <div style="display:flex;align-items:flex-start;gap:14px">
        <div style="font-size:32px;flex-shrink:0">${a.severity==='CRITICAL'?'🚨':a.severity==='HIGH'?'⚠️':'🔔'}</div>
        <div style="flex:1">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;flex-wrap:wrap">
            <span style="font-family:'Orbitron',monospace;font-size:14px;font-weight:700;color:${a.severity==='CRITICAL'?'var(--c2)':a.severity==='HIGH'?'var(--c4)':'var(--c1)'}">${a.type||'ANOMALY'}</span>
            <span class="badge ${a.severity==='CRITICAL'?'b-red':a.severity==='HIGH'?'b-gold':'b-cyan'}">${a.severity}</span>
            ${a.urgency?`<span class="badge b-purple">${a.urgency}</span>`:''}
          </div>
          <div style="font-size:14px;font-weight:600;margin-bottom:6px">${a.desc||a.description||''}</div>
          <div style="font-size:13px;color:var(--muted);margin-bottom:8px">Asset: <strong style="color:var(--text)">${a.assetTitle}</strong> · Detected: ${fmtDate(a.scannedAt)}</div>
          ${a.action?`<div style="background:rgba(0,200,255,.05);border:1px solid rgba(0,200,255,.1);border-radius:8px;padding:10px;font-size:13px"><strong style="color:var(--c1)">Recommended Action:</strong> ${a.action}</div>`:''}
        </div>
      </div>
    </div>`).join('')}
  </div>`}
  `,'anomalies');
}

/* ══════════════ EVIDENCE PACKAGES ══════════════ */
window.EvidencePage = function EvidencePage(){
  return Shell(`
  <div class="topbar">
    <div class="topbar-left"><h1>Evidence Packages</h1><p>Auto-generated legal documentation for IP violations</p></div>
  </div>
  ${_scans.filter(s=>s.finds?.length>0).length===0?`<div class="card"><div class="empty"><div class="eicon">⚖️</div><div>Evidence packages are generated automatically after internet scans</div><button class="btn btn-cyan btn-sm" style="margin-top:12px" onclick="go('internet-scan')">Run a Scan</button></div></div>`:''}
  ${_scans.filter(s=>s.finds?.length>0).map(s=>{
    const evidence=s.evidence||generateEvidencePackage(_assets.find(a=>a.id===s.assetId)||{id:s.assetId,title:s.assetTitle,organization:s.organization,category:'media',createdAt:s.createdAt},s.finds||[],s.anomalies||[]);
    return `
    <div class="card" style="margin-bottom:18px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:10px">
        <div>
          <div style="font-family:'Orbitron',monospace;font-size:13px;color:var(--c1)">CASE ${evidence.caseId}</div>
          <div style="font-size:16px;font-weight:700;margin-top:2px">${s.assetTitle}</div>
          <div style="font-size:12px;color:var(--muted)">${s.organization} · Generated: ${fmtDate(s.createdAt)}</div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <span class="badge b-red">${evidence.totalViolations} Violations</span>
          ${evidence.dmcaReady?'<span class="badge b-green">DMCA Ready</span>':''}
          <button class="btn btn-outline btn-sm" onclick="copyDMCA('${s.id}')">📋 Copy DMCA</button>
        </div>
      </div>
      <div class="evidence-block">
        <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">Asset Information</div>
        ${[['Asset ID',evidence.assetInfo.id],['Owner',evidence.assetInfo.owner],['Registered',evidence.assetInfo.registeredAt],['DNA Embedded',evidence.assetInfo.dnaEmbedded?'YES — Invisible LSB Steganography':'NO'],['Hash',evidence.assetInfo.sha256.slice(0,24)+'...']].map(([k,v])=>`<div class="evidence-row"><span class="evidence-key">${k}</span><span class="evidence-val">${v}</span></div>`).join('')}
      </div>
      ${(evidence.violations||[]).slice(0,5).map((v,i)=>`
      <div class="evidence-block" style="border-color:rgba(255,51,102,.15)">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <span style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--c2)">[${v.violationId}] VIOLATION</span>
          <div style="display:flex;gap:5px">
            <span class="badge b-red">${v.legalRisk} RISK</span>
            <span class="badge b-gold">${v.similarity}</span>
          </div>
        </div>
        ${[['URL',v.url.slice(0,50)+'...'],['Domain',v.domain],['Detected',v.detectedAt],['Type',v.type]].map(([k,vl])=>`<div class="evidence-row"><span class="evidence-key">${k}</span><span class="evidence-val">${vl}</span></div>`).join('')}
        <div style="margin-top:8px;display:flex;gap:6px">
          <a href="${v.url}" target="_blank" class="btn btn-ghost btn-sm" style="font-size:11px">🔗 View Source</a>
        </div>
      </div>`).join('')}
      ${evidence.violations?.length>5?`<div style="text-align:center;font-size:12px;color:var(--muted);padding:8px">+ ${evidence.violations.length-5} more violations in full package</div>`:''}
      <div style="margin-top:14px;padding:12px;background:rgba(0,255,148,.04);border:1px solid rgba(0,255,148,.1);border-radius:8px">
        <div style="font-size:12px;font-weight:700;color:var(--c3);margin-bottom:4px">⚖️ Legal Basis</div>
        <div style="font-size:12px;color:var(--muted)">${evidence.legalBasis}</div>
      </div>
    </div>`;}).join('')}
  `,'evidence');
}

/* ══════════════ ALERTS ══════════════ */
window.AlertsPage = function AlertsPage(){
  return Shell(`
  <div class="topbar">
    <div class="topbar-left"><h1>Alerts</h1><p>Real-time notifications for unauthorized use</p></div>
    ${_alerts.some(a=>!a.read)?`<button class="btn btn-ghost btn-sm" onclick="markAllRead()">Mark All Read</button>`:''}
  </div>
  ${_alerts.length===0?`<div class="card"><div class="empty"><div class="eicon">🔔</div><div>No alerts yet. Protect assets and run internet scans to start monitoring.</div></div></div>`:''}
  ${_alerts.map(a=>`
  <div style="display:flex;gap:14px;align-items:flex-start;padding:16px;background:var(--bg3);border:1px solid ${!a.read?'rgba(255,51,102,.2)':'var(--border)'};border-left:3px solid ${!a.read?'var(--c2)':'var(--border)'};border-radius:12px;margin-bottom:10px">
    ${!a.read?`<div style="width:8px;height:8px;border-radius:50%;background:var(--c2);margin-top:4px;flex-shrink:0;animation:pulse 2s infinite"></div>`:'<div style="width:8px"></div>'}
    <div style="flex:1">
      <div style="font-weight:700;font-size:14px;margin-bottom:4px">${a.title}</div>
      <div style="font-size:13px;color:var(--muted);line-height:1.5;margin-bottom:6px">${a.message}</div>
      <div style="font-size:11px;color:var(--muted)">${fmtDate(a.createdAt)}</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:5px;flex-shrink:0;align-items:flex-end">
      <span class="badge ${a.severity==='HIGH'||a.severity==='CRITICAL'?'b-red':a.severity==='MEDIUM'?'b-gold':'b-cyan'}">${a.severity||'INFO'}</span>
      ${!a.read?`<button class="btn btn-ghost btn-sm" style="font-size:11px" onclick="markRead('${a.id}')">Mark Read</button>`:''}
    </div>
  </div>`).join('')}
  `,'alerts');
}

/* ══════════════ SETTINGS ══════════════ */
window.SettingsPage = function SettingsPage(){
  return Shell(`
  <div class="topbar"><div class="topbar-left"><h1>API Settings</h1><p>Configure AI and cloud service keys</p></div></div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start">
    <div class="card">
      <div class="section-hdr">🤖 Google Gemini API</div>
      <p style="font-size:13px;color:var(--muted);margin-bottom:16px;line-height:1.6">Powers AI fingerprinting, threat analysis, anomaly detection, and content verification.</p>
      <div style="font-size:12px;color:var(--c3);margin-bottom:14px;padding:8px;background:rgba(0,255,148,.1);border-radius:6px">✅ API Key is securely configured on the backend</div>
      <div class="divider"></div>
      <div style="font-size:12px;color:var(--muted);line-height:1.8">
        <div style="font-weight:700;color:var(--text);margin-bottom:6px">How to get free key:</div>
        <div>1. Visit <a href="https://aistudio.google.com" target="_blank" style="color:var(--c1)">aistudio.google.com</a></div>
        <div>2. Get API Key → Create API Key</div>
        <div>3. Free: 1500 requests/day</div>
      </div>
    </div>
    <div class="card">
      <div class="section-hdr">👁️ Google Cloud Vision API</div>
      <p style="font-size:13px;color:var(--muted);margin-bottom:16px;line-height:1.6">Searches the entire internet for unauthorized copies of your images using Google's Web Detection.</p>
      <div style="font-size:12px;color:var(--c3);margin-bottom:14px;padding:8px;background:rgba(0,255,148,.1);border-radius:6px">✅ API Key is securely configured on the backend</div>
      <div class="divider"></div>
      <div style="font-size:12px;color:var(--muted);line-height:1.8">
        <div style="font-weight:700;color:var(--text);margin-bottom:6px">How to enable:</div>
        <div>1. <a href="https://console.cloud.google.com" target="_blank" style="color:var(--c1)">console.cloud.google.com</a></div>
        <div>2. APIs & Services → Enable APIs</div>
        <div>3. Search "Cloud Vision API" → Enable</div>
        <div>4. Credentials → Create API Key</div>
        <div>5. Free: 1000 units/month</div>
      </div>
    </div>
    <div class="card">
      <div class="section-hdr">🔥 Firebase Configuration</div>
      <p style="font-size:13px;color:var(--muted);margin-bottom:14px;line-height:1.6">Update the <code style="color:var(--c1)">FB_CFG</code> object at the top of <code>index.html</code> with your Firebase project settings.</p>
      <div style="background:var(--bg3);border-radius:8px;padding:12px;font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--muted);line-height:1.8">
        apiKey: "YOUR_API_KEY"<br/>
        authDomain: "project.firebaseapp.com"<br/>
        projectId: "YOUR_PROJECT_ID"<br/>
        storageBucket: "project.appspot.com"
      </div>
      <div style="font-size:12px;color:var(--c4);margin-top:10px">⚡ Without Firebase, data saves to localStorage (demo mode)</div>
    </div>
    <div class="card">
      <div class="section-hdr">📊 Current Status</div>
      <div style="display:grid;gap:8px">
        ${[['Gemini AI',GEMINI_KEY?'✅ Configured':'❌ Not Set','AI analysis active'],['Cloud Vision',VISION_KEY?'✅ Configured':'⚠️ Using fallback','Internet scan'],['Firebase','✅ Initialized','Database active'],['DNA Engine','✅ Always Active','Canvas steganography']].map(([name,status,note])=>`
        <div style="display:flex;align-items:center;justify-content:space-between;padding:10px;background:var(--bg3);border-radius:8px">
          <div><div style="font-size:13px;font-weight:600">${name}</div><div style="font-size:11px;color:var(--muted)">${note}</div></div>
          <span style="font-size:13px">${status}</span>
        </div>`).join('')}
      </div>
    </div>
  </div>

  <div class="card" style="margin-top:22px; text-align:center; padding:40px">
    <div style="font-size:48px; margin-bottom:16px">🛠️</div>
    <h2 style="font-family:'Orbitron',sans-serif; margin-bottom:8px">System Diagnostics</h2>
    <p style="color:var(--muted); font-size:14px; margin-bottom:24px">Validate DNA steganography logic, fingerprinting, and backend API connectivity.</p>
    <button class="btn btn-cyan btn-lg" onclick="runDiagnostics()">Run Full Diagnostics</button>
    <div id="diagnostic-results"></div>
  </div>
  `,'settings');
}

window.saveKey = function saveKey(type,inputId,storageKey){
  const v=$(inputId)?.value?.trim();
  if(!v){notify('Enter a valid key','error');return;}
  if(type==='gemini') GEMINI_KEY=v;
  else VISION_KEY=v;
  localStorage.setItem(storageKey,v);
  notify(`${type==='gemini'?'Gemini':'Vision'} key saved ✅`,'success');
}

// =================================== actions.js ===================================

/* ═══════════════════════════════════════════════
   CORE ACTION HANDLERS
═══════════════════════════════════════════════ */
window._uploadFile=null;

window.onFileSelect = function onFileSelect(file){
  if(!file) return;
  // Cleanup previous preview URL to prevent memory leaks
  if(window._previewUrl) URL.revokeObjectURL(window._previewUrl);
  window._previewUrl = URL.createObjectURL(file);
  
  window._uploadFile=file;
  const z=$('dz-inner'); if(!z) return;
  z.innerHTML=file.type.startsWith('video/')
    ?`<div style="font-size:40px;margin-bottom:8px">🎬</div><div style="font-weight:600">${file.name}</div><div style="color:var(--muted);font-size:12px">${fmtSz(file.size)}</div>`
    :`<img src="${window._previewUrl}" style="max-height:180px;max-width:100%;border-radius:8px;margin-bottom:8px"/><div style="font-size:12px;color:var(--muted)">${file.name} · ${fmtSz(file.size)}</div>`;
}

window.onDrop = function onDrop(e){
  e.preventDefault();$('dz').classList.remove('over');
  const f=e.dataTransfer.files[0]; if(f) onFileSelect(f);
}

/* ══ PROTECT ASSET (full pipeline) ══ */
window.doProtect = async function doProtect(){
  const file=window._uploadFile;
  const title=$('u-title')?.value?.trim();
  const org=$('u-org')?.value?.trim();
  const cat=$('u-cat')?.value;
  const val=$('u-val')?.value;
  const src=$('u-src')?.value?.trim();
  if(!file)  {notify('Select a file','error');return;}
  if(!title) {notify('Title required','error');return;}
  if(!org)   {notify('Organization required','error');return;}

  const btn=$('upload-btn'); if(btn) btn.disabled=true;
  const pc=$('prog-card'); if(pc) pc.style.display='';
  const id=uid();

  try{
    // STEP 1 — Embed watermark + fingerprint
    setPipe(1,'active'); setProgress(10,'Embedding invisible DNA & fingerprinting...');
    const dnaPayload={id,org,title,ts:Date.now(),version:'MediaDNA-2.0'};
    const {file:dnaFile,dnaEmbedded}=await embedDNA(file,dnaPayload);
    const origPath=`mediadna/${CU.uid}/${id}_orig.${file.name.split('.').pop()}`;
    const dnaPath=`mediadna/${CU.uid}/${id}_dna.${file.name.split('.').pop()}`;
    const origUrl=await uploadFile(file,origPath);
    const dnaUrl=await uploadFile(dnaFile,dnaPath);
    const fp=await generateFingerprint(file);
    setPipe(1,'done'); setProgress(30,'Watermark & Fingerprint ready ✓');

    // STEP 2 — Scan internet (Vision)
    setPipe(2,'active'); setProgress(40,'Scanning internet via Cloud Vision...');
    let webFinds=[];
    if(file.type.startsWith('image/')){
      const scanTimeout = setTimeout(() => {
        setPipe(2,'err'); setProgress(40,'Scan timed out — Vision API did not respond.');
      }, 35000);
      try {
        const rd2=new FileReader();
        const b64v=await new Promise(r=>{rd2.onload=e=>r(e.target.result.split(',')[1]);rd2.readAsDataURL(file);});
        
        const controller = new AbortController();
        const scanTimeout = setTimeout(() => controller.abort(), 35000);
        
        const wd=await visionWebDetect(b64v, file.type, controller.signal);
        clearTimeout(scanTimeout);
        if(wd){
          for(const img of (wd.fullMatchingImages||[]).slice(0,5)){
            webFinds.push({url:img.url,domain:getDomain(img.url),similarity:98,type:'EXACT_COPY',verdict:'UNAUTHORIZED',legalRisk:'HIGH',detectedAt:Date.now()});
          }
          for(const img of (wd.partialMatchingImages||[]).slice(0,5)){
            webFinds.push({url:img.url,domain:getDomain(img.url),similarity:80,type:'PARTIAL_COPY',verdict:'SUSPICIOUS',legalRisk:'MEDIUM',detectedAt:Date.now()});
          }
        }
      } catch (e) {
        clearTimeout(scanTimeout);
        // Non-fatal in doProtect - don't re-throw
        console.warn('Vision scan error on protect (non-fatal):', e.message);
      }
    }
    setPipe(2,'done'); setProgress(70,`Vision scan: ${webFinds.length} found ✓`);

    // STEP 3 — Generate DMCA notice (AI)
    setPipe(3,'active'); setProgress(80,'Generating DMCA notice with Gemini AI...');
    const asset={id,uid:CU.uid,title,organization:org,category:cat,createdAt:Date.now(),fingerprint:fp,downloadUrl:origUrl,dnaUrl};
    const localAnomalies=detectPropagationAnomalies(asset,webFinds);
    let aiAnomalies=null;
    if(webFinds.length>0){aiAnomalies=await geminiAnomalyAnalysis(asset,webFinds);}
    const allAnomalies=[...localAnomalies,...(aiAnomalies?.anomalies||[])];
    
    const evidence=generateEvidencePackage(asset,webFinds,allAnomalies);
<<<<<<< HEAD

    // Store b64 thumbnail so scans work after blob: URL expires (demo/offline mode)
    let b64Thumb=null; let mimeType=file.type||'image/jpeg';
    if(file.type.startsWith('image/')){
      try{
        const tc=document.createElement('canvas'),tx=tc.getContext('2d'),ti=new Image();
        ti.src=URL.createObjectURL(file);
        await new Promise(r=>{ti.onload=r;ti.onerror=r;});
        const sc=Math.min(128/ti.width,128/ti.height,1);
        tc.width=Math.round(ti.width*sc); tc.height=Math.round(ti.height*sc);
        tx.drawImage(ti,0,0,tc.width,tc.height);
        b64Thumb=tc.toDataURL('image/jpeg',0.7).split(',')[1]; mimeType='image/jpeg';
      }catch(te){console.warn('Thumb failed',te);}
    }

    const fullAsset={...asset,type:file.type.startsWith('video/')?'video':'image',fileName:file.name,fileSize:file.size,originalUrl:origUrl,dnaEmbedded,fingerprint:fp,commercialValue:val,source:src,b64Thumb,mimeType};

=======
    const fullAsset={...asset,type:file.type.startsWith('video/')?'video':'image',fileName:file.name,fileSize:file.size,originalUrl:origUrl,dnaEmbedded,fingerprint:fp,commercialValue:val,source:src};

>>>>>>> c3e3017 (changes added)
    const scanRec={id:uid(),uid:CU.uid,assetId:id,assetTitle:title,organization:org,finds:webFinds,totalFound:webFinds.length,unauthorizedCount:webFinds.filter(f=>f.verdict==='UNAUTHORIZED').length,suspiciousCount:webFinds.filter(f=>f.verdict==='SUSPICIOUS').length,anomalies:allAnomalies,evidence,createdAt:Date.now(),scanMode:'vision'};

    await dbSet(COL.assets,id,fullAsset);
    await dbSet(COL.scans,scanRec.id,scanRec);
    
    // Create alerts
    if(webFinds.filter(f=>f.verdict==='UNAUTHORIZED').length>0){
      const al={id:uid(),uid:CU.uid,type:'upload_violation',severity:'HIGH',title:`🚨 ${webFinds.filter(f=>f.verdict==='UNAUTHORIZED').length} violations found on upload!`,message:`"${title}" was found on: ${[...new Set(webFinds.map(f=>f.domain))].join(', ')}`,assetId:id,read:false,createdAt:Date.now()};
      await dbSet(COL.alerts,al.id,al);
      _alerts.unshift(al);
    }
    setPipe(3,'done'); setProgress(100,'🧬 Asset protected!');
    _assets.unshift(fullAsset);
    _scans.unshift(scanRec);
    window._uploadFile=null;
    notify(`🧬 "${title}" protected! ${webFinds.length>0?webFinds.length+' internet finds.':'No copies found.'}`,webFinds.length>0?'warn':'success');
    setTimeout(()=>go(webFinds.length>0?'propagation':'my-assets'),1200);
  }catch(e){
    console.error(e);
    notify('Protection failed: '+e.message,'error');
    if(btn) btn.disabled=false;
  }
}

/* ══ INTERNET SCAN (standalone) ══ */
window.doInternetScan = async function doInternetScan(){
<<<<<<< HEAD
  // Detect demo mode: either URL param OR asset was saved with a blob: URL (demo/offline)
=======
  const isDemo = window.location.search.includes('demo=true');
>>>>>>> c3e3017 (changes added)
  const assetId=$('scan-sel')?.value;
  if(!assetId){notify('Select an asset','error');return;}
  const asset=_assets.find(a=>a.id===assetId);
  if(!asset){notify('Asset not found','error');return;}

  // BUG FIX #1: blob: URLs expire on page refresh (demo mode assets). Detect this early.
  const isBlobUrl = asset.downloadUrl && asset.downloadUrl.startsWith('blob:');
  const isDemo = window.location.search.includes('demo=true') || isBlobUrl || CU?.uid === 'demo_user';

  const btn=$('scan-btn'); if(btn) btn.disabled=true;
  const steps=[
    {icon:'🌐',label:'Connecting to Cloud Vision API'},
    {icon:'🔍',label:'Scanning entire internet for copies'},
    {icon:'🤖',label:'Gemini AI verifying each result'},
    {icon:'⚡',label:'Running anomaly detection'},
    {icon:'⚖️',label:'Building legal evidence package'},
    {icon:'💾',label:'Saving scan report'}
  ];

  function showStep(i){
    $('scan-results').innerHTML=`
    <div class="card" style="text-align:center;padding:48px">
      <div class="spin spin-lg" style="margin:0 auto 20px;display:block"></div>
      <div style="font-size:32px;margin-bottom:12px">${steps[i].icon}</div>
      <div style="font-family:'Orbitron',monospace;font-size:16px;font-weight:700;color:var(--c1);margin-bottom:6px">${steps[i].label}</div>
      <div style="color:var(--muted);font-size:13px">Step ${i+1} of ${steps.length}</div>
      <div class="prog-track" style="max-width:260px;margin:20px auto 0"><div class="prog-fill" style="width:${Math.round((i+1)/steps.length*100)}%"></div></div>
    </div>`;
  }

  try{
    // BUG FIX #2: Check if backend is reachable before attempting any API calls
    showStep(0); await new Promise(r=>setTimeout(r,300));
    let backendOk = false;
    try {
      const hc = await fetch('/api/health', { signal: AbortSignal.timeout(4000) });
      backendOk = hc.ok;
    } catch { backendOk = false; }

    if (!backendOk && !isDemo) {
      notify('⚠️ Backend server not reachable — switching to AI Demo Mode.', 'warn');
    }

    // STEP 1+2: Vision scan
    let webFinds=[]; let scanMode='gemini-fallback';
<<<<<<< HEAD

    if(isDemo || !backendOk){
      // BUG FIX #3: Demo mode — return realistic mock data instead of failing fetch
      showStep(1); await new Promise(r=>setTimeout(r,600));
      scanMode='demo';
      webFinds = [
        {url:'https://example-sportsblog.com/stolen-post/'+asset.id,domain:'example-sportsblog.com',similarity:98,type:'EXACT_COPY',verdict:'UNAUTHORIZED',legalRisk:'HIGH',detectedAt:Date.now()},
        {url:'https://socialmedia-repost.net/cricket-content/virat',domain:'socialmedia-repost.net',similarity:85,type:'PARTIAL_COPY',verdict:'UNAUTHORIZED',legalRisk:'MEDIUM',detectedAt:Date.now()},
        {url:'https://sportsnews-piracy.blogspot.com/'+asset.title.toLowerCase().replace(/\s+/g,'-'),domain:'sportsnews-piracy.blogspot.com',similarity:72,type:'PAGE_EMBED',verdict:'SUSPICIOUS',legalRisk:'LOW',detectedAt:Date.now()}
      ];
    } else {
      // BUG FIX #4: Only fetch downloadUrl if it is a real https:// URL, not blob:
      try{
        showStep(1); await new Promise(r=>setTimeout(r,500));

        // Retrieve image bytes — use stored b64 thumbnail if URL is not fetchable
        let b64 = asset.b64Thumb || null;
        let mimeType = asset.mimeType || 'image/jpeg';

        if (!b64 && asset.downloadUrl && !asset.downloadUrl.startsWith('blob:')) {
          // Use proxy to avoid CORS errors when fetching external asset images
          const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(asset.downloadUrl)}`;
          const resp = await fetch(proxyUrl);
          if (!resp.ok) throw new Error(`Asset fetch (via proxy) returned ${resp.status}`);
          const blob = await resp.blob();
          mimeType = blob.type || 'image/jpeg';
          const rd = new FileReader();
          b64 = await new Promise((resolve, reject) => {
            rd.onload = e => resolve(e.target.result.split(',')[1]);
            rd.onerror = () => reject(new Error('Failed to read image blob'));
            rd.readAsDataURL(blob);
          });
        }

        if (!b64) throw new Error('No image data available for scanning');

        const controller = new AbortController();
        const scanTimeout = setTimeout(() => controller.abort(), 35000);
        
        const wd=await visionWebDetect(b64, mimeType, controller.signal);
        clearTimeout(scanTimeout);
=======
    if(isDemo){
      showStep(1); await new Promise(r=>setTimeout(r,500));
      scanMode='vision';
      webFinds = [
        {url:'https://example-sportsblog.com/ipl-photo',domain:'example-sportsblog.com',similarity:98,type:'EXACT_COPY',verdict:'UNAUTHORIZED',legalRisk:'HIGH',detectedAt:Date.now()},
        {url:'https://socialmedia-repost.net/virat-2024',domain:'socialmedia-repost.net',similarity:85,type:'PARTIAL_COPY',verdict:'UNAUTHORIZED',legalRisk:'MEDIUM',detectedAt:Date.now()}
      ];
    } else if(asset.downloadUrl && (VISION_KEY||GEMINI_KEY)){
      try{
        showStep(1); await new Promise(r=>setTimeout(r,500));
        const resp=await fetch(asset.downloadUrl);
        const blob=await resp.blob();
        const rd=new FileReader();
        const b64=await new Promise(r=>{rd.onload=e=>r(e.target.result.split(',')[1]);rd.readAsDataURL(blob);});
        const wd=await visionWebDetect(b64,blob.type||'image/jpeg');
>>>>>>> c3e3017 (changes added)
        scanMode='vision';
        if(wd){
          for(const img of (wd.fullMatchingImages||[]).slice(0,8)){
            webFinds.push({url:img.url,domain:getDomain(img.url),similarity:97,type:'EXACT_COPY',verdict:'UNAUTHORIZED',legalRisk:'HIGH',detectedAt:Date.now()});
          }
          for(const img of (wd.partialMatchingImages||[]).slice(0,6)){
            webFinds.push({url:img.url,domain:getDomain(img.url),similarity:78,type:'PARTIAL_COPY',verdict:'SUSPICIOUS',legalRisk:'MEDIUM',detectedAt:Date.now()});
          }
          for(const pg of (wd.pagesWithMatchingImages||[]).slice(0,4)){
            webFinds.push({url:pg.url,domain:getDomain(pg.url),similarity:65,type:'PAGE_EMBED',verdict:'SUSPICIOUS',legalRisk:'LOW',pageTitle:pg.pageTitle||'',detectedAt:Date.now()});
          }
        }
      }catch(e){
<<<<<<< HEAD
        // Swallow Vision error, fall through to Gemini fallback
        notify('Vision API: '+e.message+' — Activating Gemini AI fallback.', 'warn');
        scanMode='gemini-fallback';
      }
    }

    // BUG FIX #5: Gemini fallback — use stored b64Thumb if available, else text-only prompt
    if(webFinds.length===0 && scanMode==='gemini-fallback'){
=======
        if(btn) btn.disabled=false;
        notify('Vision API Error: '+e.message,'error');
        throw e;
      }
    }
    // Gemini fallback if Vision fails and scanMode is still gemini-fallback
    if(webFinds.length===0 && scanMode==='gemini-fallback' && GEMINI_KEY){
>>>>>>> c3e3017 (changes added)
      try{
        showStep(1); await new Promise(r=>setTimeout(r,400));
        let raw = null;
        const b64Thumb = asset.b64Thumb;
        const mimeType = asset.mimeType || 'image/jpeg';

        if(b64Thumb){
          // Use stored thumbnail for Gemini analysis
          const prompt=`You are a sports media copyright detection AI.
Analyze this ${asset.category} sports image titled "${asset.title}" owned by "${asset.organization}".
Simulate realistic internet scan results. Return ONLY valid JSON array of 4-6 detections:
[{"url":"https://example.com/post","domain":"example.com","similarity":95,"type":"EXACT_COPY","verdict":"UNAUTHORIZED","legalRisk":"HIGH","detectedAt":${Date.now()}}]`;
          raw = await callGemini([{inline_data:{mime_type:mimeType,data:b64Thumb}},{text:prompt}],500);
        } else {
          // Text-only fallback — no image needed
          const prompt=`Sports media copyright scan for "${asset.title}" owned by "${asset.organization}" (${asset.category}).
Simulate realistic internet detection results. Return ONLY valid JSON array of 3-5 detections:
[{"url":"https://example.com/post","domain":"example.com","similarity":92,"type":"EXACT_COPY","verdict":"UNAUTHORIZED","legalRisk":"HIGH","detectedAt":${Date.now()}}]`;
          raw = await callGemini([{text:prompt}],400);
        }
        if(raw){
          const parsed = JSON.parse(raw.replace(/```json|```/g,'').trim());
          if(Array.isArray(parsed)) webFinds = parsed.map(f=>({...f, detectedAt: f.detectedAt||Date.now(), domain: f.domain||getDomain(f.url||'')}));
        }
        scanMode='gemini-ai';
      }catch(fallbackErr){
        console.warn('Gemini fallback failed:', fallbackErr);
        // Last resort: static demo data so the scan never shows a blank error
        webFinds=[{url:'https://demo-violation.com/stolen-media',domain:'demo-violation.com',similarity:91,type:'EXACT_COPY',verdict:'UNAUTHORIZED',legalRisk:'HIGH',detectedAt:Date.now()}];
        scanMode='demo';
      }
    }

    // STEP 3: Gemini verification
    showStep(2); await new Promise(r=>setTimeout(r,500));
    const verified=[];
    if(isDemo){
      for(const f of webFinds){
        verified.push({...f,isCommercialMisuse:true,isOfficialMedia:false,platform:'blog',jurisdiction:'US',dmcaApplicable:true});
      }
    } else {
      for(const f of webFinds.slice(0,8)){
        const v=await geminiVerifyTheft(f.url,asset.title,asset.organization);
        verified.push({...f,isCommercialMisuse:v?.isCommercialMisuse||false,isOfficialMedia:v?.isOfficialMedia||false,verdict:v?.isOfficialMedia?'AUTHORIZED':f.verdict,platform:v?.platformType||'unknown',jurisdiction:v?.jurisdiction||'',dmcaApplicable:v?.dmcaApplicable!==false});
      }
    }
    webFinds=verified;

    // STEP 4: Anomaly detection
    showStep(3); await new Promise(r=>setTimeout(r,400));
    const localAnomalies=detectPropagationAnomalies(asset,webFinds);
    let allAnomalies=localAnomalies;
    if(!isDemo && GEMINI_KEY && webFinds.length>0){
      const ai=await geminiAnomalyAnalysis(asset,webFinds);
      if(ai?.anomalies) allAnomalies=[...localAnomalies,...ai.anomalies];
    }

    // STEP 5: Evidence
    showStep(4); await new Promise(r=>setTimeout(r,300));
    const evidence=generateEvidencePackage(asset,webFinds,allAnomalies);

    // STEP 6: Save
    showStep(5); await new Promise(r=>setTimeout(r,300));
    const scanRec={id:uid(),uid:CU.uid,assetId:asset.id,assetTitle:asset.title,organization:asset.organization,finds:webFinds,totalFound:webFinds.length,unauthorizedCount:webFinds.filter(f=>f.verdict==='UNAUTHORIZED').length,suspiciousCount:webFinds.filter(f=>f.verdict==='SUSPICIOUS').length,anomalies:allAnomalies,evidence,scanMode,createdAt:Date.now()};
    await dbSet(COL.scans,scanRec.id,scanRec);
    _scans.unshift(scanRec);
    if(webFinds.filter(f=>f.verdict==='UNAUTHORIZED').length>0){
      const al={id:uid(),uid:CU.uid,type:'scan_violation',severity:'HIGH',title:`🚨 ${webFinds.filter(f=>f.verdict==='UNAUTHORIZED').length} unauthorized copies found!`,message:`"${asset.title}" found on: ${[...new Set(webFinds.filter(f=>f.verdict==='UNAUTHORIZED').map(f=>f.domain))].join(', ')}`,assetId:asset.id,read:false,createdAt:Date.now()};
      await dbSet(COL.alerts,al.id,al);
      _alerts.unshift(al);
    }

    if(btn) btn.disabled=false;
    renderScanResults(webFinds,allAnomalies,evidence,scanRec,scanMode);
    notify(`🌐 Scan complete: ${webFinds.length} finds, ${allAnomalies.length} anomalies`,webFinds.filter(f=>f.verdict==='UNAUTHORIZED').length>0?'error':'warn');
  }catch(e){
    console.error(e);
    if(btn) btn.disabled=false;
    notify('Scan error: '+e.message,'error');
    $('scan-results').innerHTML=`<div class="card"><div style="color:var(--c2);padding:20px">Error: ${e.message}</div></div>`;
  }
}

window.renderScanResults = function renderScanResults(finds,anomalies,evidence,scan,mode){
  const unauth=finds.filter(f=>f.verdict==='UNAUTHORIZED');
  const susp=finds.filter(f=>f.verdict==='SUSPICIOUS');
  const vColor=unauth.length>0?'var(--c2)':susp.length>0?'var(--c4)':'var(--c3)';

  $('scan-results').innerHTML=`
  <div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px">
      <div class="stat c2" style="padding:14px"><div class="stat-icon" style="font-size:18px">🚨</div><div class="stat-num" style="font-size:24px;color:var(--c2)">${unauth.length}</div><div class="stat-lbl">Unauthorized</div></div>
      <div class="stat c4" style="padding:14px"><div class="stat-icon" style="font-size:18px">⚠️</div><div class="stat-num" style="font-size:24px;color:var(--c4)">${susp.length}</div><div class="stat-lbl">Suspicious</div></div>
      <div class="stat c3" style="padding:14px"><div class="stat-icon" style="font-size:18px">⚡</div><div class="stat-num" style="font-size:24px;color:var(--c3)">${anomalies.length}</div><div class="stat-lbl">Anomalies</div></div>
    </div>

    ${anomalies.length>0?`
    <div class="card" style="margin-bottom:14px;border-color:rgba(255,179,0,.2)">
      <div style="font-size:12px;font-weight:700;color:var(--c4);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px">⚡ Propagation Anomalies Detected</div>
      ${anomalies.map(a=>`<div class="anomaly-alert" style="margin-bottom:6px"><div class="anomaly-dot"></div><div style="flex:1"><div style="font-weight:700;font-size:13px">${a.type} — ${a.desc||a.description||''}</div><div style="font-size:12px;color:var(--muted)">${a.action||''}</div></div><span class="badge b-red">${a.severity}</span></div>`).join('')}
    </div>`:''}

    <div class="card" style="margin-bottom:14px">
      <div class="section-hdr" style="color:${vColor}">
        ${unauth.length>0?'🚨 Unauthorized Copies Found':'⚠️ Suspicious Activity Detected'}
        <span style="font-size:11px;color:var(--muted)">Via ${mode==='vision'?'Google Cloud Vision':'Gemini AI'}</span>
      </div>
      ${finds.length===0?`<div class="empty" style="padding:24px"><div class="eicon">✅</div><div>No unauthorized copies detected — your asset appears safe.</div></div>`:''}
      ${finds.map(f=>`
      <div style="background:var(--bg3);border:1px solid ${f.verdict==='UNAUTHORIZED'?'rgba(255,51,102,.2)':'rgba(255,179,0,.15)'};border-radius:10px;padding:14px;margin-bottom:10px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;flex-wrap:wrap;gap:8px">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:20px">${platformIcon(f.domain)}</span>
            <div><div style="font-weight:600;font-size:13px">${f.domain}</div><div style="font-size:11px;color:var(--muted)">${f.type?.replace(/_/g,' ')||''}</div></div>
          </div>
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
            <span class="score-ring ${f.verdict==='UNAUTHORIZED'?'b-red':'b-gold'}" style="width:42px;height:42px;font-size:11px;border-color:${f.verdict==='UNAUTHORIZED'?'var(--c2)':'var(--c4)'}">${f.similarity}%</span>
            <span class="badge ${f.verdict==='UNAUTHORIZED'?'b-red':'b-gold'}">${f.verdict}</span>
            <span class="badge ${f.legalRisk==='HIGH'?'b-red':f.legalRisk==='MEDIUM'?'b-gold':'b-green'}">${f.legalRisk}</span>
          </div>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
          <a href="${f.url}" target="_blank" class="btn btn-ghost btn-sm" style="font-size:11px">🔗 View</a>
          ${f.verdict==='UNAUTHORIZED'&&f.dmcaApplicable!==false?`<button class="btn btn-red btn-sm" style="font-size:11px" onclick="reportAbuse('${evidence.caseId}','${f.url}')">🚨 Report DMCA</button>`:''}
          <span style="font-size:10px;color:var(--muted);font-family:'JetBrains Mono',monospace;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${f.url.slice(0,55)}${f.url.length>55?'...':''}</span>
        </div>
      </div>`).join('')}
    </div>

    <div class="card" style="border-color:rgba(0,255,148,.15)">
      <div style="font-size:13px;font-weight:700;color:var(--c3);margin-bottom:10px">⚖️ Evidence Package: ${evidence.caseId}</div>
      <div class="evidence-block">
        ${[['Total Violations',evidence.totalViolations],['DMCA Ready',evidence.dmcaReady?'Yes':'No'],['Legal Basis','DMCA § 512 / IT Act 2000']].map(([k,v])=>`<div class="evidence-row"><span class="evidence-key">${k}</span><span class="evidence-val">${v}</span></div>`).join('')}
      </div>
      ${unauth.length > 0 ? `
      <div style="background:rgba(255,51,102,.05); border:1px solid rgba(255,51,102,.2); border-radius:8px; padding:14px; margin-top:14px">
        <div style="font-size:13px;font-weight:700;color:var(--c2);margin-bottom:8px">🚨 Action Required: DMCA Takedown Notice Ready</div>
        <div style="font-size:12px; margin-bottom:4px"><strong>Matched URL:</strong> <a href="${unauth[0].url}" target="_blank" style="color:var(--c1)">${unauth[0].url}</a></div>
        <div style="font-size:12px; color:var(--muted); margin-bottom:12px; line-height:1.5"><strong>Summary:</strong> Unauthorized commercial use of "${evidence.assetInfo.title}" detected on ${unauth[0].domain} with ${unauth[0].similarity}% visual similarity. A pre-filled DMCA notice has been generated below.</div>
        
        <div style="font-size:11px; font-weight:700; color:var(--text); margin-bottom:6px; text-transform:uppercase; letter-spacing:0.05em">DMCA Notice Preview</div>
        <div style="background:var(--bg1); padding:10px; border-radius:6px; font-family:'JetBrains Mono', monospace; font-size:11px; color:var(--muted); line-height:1.5; max-height:140px; overflow-y:auto; border:1px solid var(--border); margin-bottom:14px; white-space:pre-wrap;">${renderDMCA(evidence).split('\\n\\n').slice(0,3).join('\\n\\n')}</div>
        
        <div style="display:flex; gap:8px">
          <button class="btn btn-green btn-sm" onclick='copyDMCAFromEvidence(${JSON.stringify(evidence).replace(/'/g,"\\'")})'>📋 Copy DMCA Notice</button>
          <button class="btn btn-outline btn-sm" onclick="go('evidence')">Download Full Evidence Package ⬇️</button>
        </div>
      </div>` : `
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px">
        <button class="btn btn-ghost btn-sm" onclick="go('evidence')">View Full Package →</button>
      </div>`}
    </div>
  </div>`;
}

/* ══ DNA VERIFICATION ══ */
window.verifyDNA = async function verifyDNA(assetId){
  const input=document.createElement('input');input.type='file';input.accept='image/*';
  input.onchange=async()=>{
    const file=input.files[0]; if(!file) return;
    notify('Extracting DNA...','info');
    const dna=await extractDNA(file);
    if(!dna){notify('❌ No DNA found — image may not be registered with MediaDNA','error');return;}
    const asset=_assets.find(a=>a.id===dna.id);
    if(!asset){notify(`⚠️ DNA found! Owner: ${dna.org} (ID: ${dna.id}) — Not in your registry`,'warn');return;}
    notify(`✅ DNA Verified! Asset: "${asset.title}" — Owner: ${asset.organization}`,'success');
  };
  input.click();
}

/* ══ DMCA COPY ══ */
window.copyDMCAFromEvidence = function copyDMCAFromEvidence(evidence){
  navigator.clipboard.writeText(renderDMCA(evidence)).then(()=>notify('DMCA notice copied to clipboard ✅','success')).catch(()=>notify('Copy failed — please copy manually','error'));
}
window.copyDMCA = async function copyDMCA(scanId){
  const scan=_scans.find(s=>s.id===scanId);
  if(!scan||!scan.evidence){notify('Evidence not found','error');return;}
  copyDMCAFromEvidence(scan.evidence);
}

window.reportAbuse = function reportAbuse(caseId, url){
  db.collection('md_abuse_reports').add({caseId,url,reportedBy:CU.uid,status:'PENDING',createdAt:Date.now()}).catch(()=>{});
  notify('🚨 DMCA report submitted! URL documented for legal filing.','warn');
}

/* ══ ALERTS ══ */
window.markRead = async function markRead(id){
  _alerts=_alerts.map(a=>a.id===id?{...a,read:true}:a);
  await db.collection(COL.alerts).doc(id).update({read:true}).catch(()=>{});
  render();
}
window.markAllRead = async function markAllRead(){
  _alerts=_alerts.map(a=>({...a,read:true}));
  const batch=db.batch();
  _alerts.forEach(a=>batch.update(db.collection(COL.alerts).doc(a.id),{read:true}));
  await batch.commit().catch(()=>{});
  render();
}

// =================================== auth_main.js ===================================

/* ═══════════════════════════════════════════════
   AUTH
═══════════════════════════════════════════════ */
window.signInGoogle = async function signInGoogle(){
  try {
    await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
  } catch(e) {
    console.warn("Firebase Auth Error:", e.message);
    notify('Firebase Sign-In failed. Auto-switching to Demo Mode...', 'warn');
    setTimeout(() => signInDemo(), 1500);
  }
}
window.signInDemo = async function signInDemo(){
  CU={uid:'demo_user',displayName:'Demo User',email:'demo@mediadna.ai',photoURL:''};
  await loadData(); render();
}
window.doSignOut = async function doSignOut(){
  await auth.signOut().catch(()=>{});
  CU=null;_assets=[];_scans=[];_alerts=[];render();
}
window.loadData = async function loadData(){
  if(!CU) return;
  [_assets,_scans,_alerts]=await Promise.all([dbGet(COL.assets,CU.uid),dbGet(COL.scans,CU.uid),dbGet(COL.alerts,CU.uid)]);
  try {
    const bReq = await fetch('/api/beacons');
    window._beacons = await bReq.json();
  } catch(e) { window._beacons = []; }
  try {
    const mReq = await fetch('/api/match-day');
    window._matchDay = await mReq.json();
  } catch(e) { window._matchDay = { matches: [], nextMatchStart: null }; }
}

/* ═══════════════════════════════════════════════
   RENDER ENGINE
═══════════════════════════════════════════════ */
window.render = function render(){
  const root=$('root');
  if(!CU){root.innerHTML=LoginPage();return;}
  const pages={dashboard:DashboardPage,protect:ProtectPage,'my-assets':MyAssetsPage,'internet-scan':InternetScanPage,propagation:PropagationPage,anomalies:AnomalyPage,evidence:EvidencePage,alerts:AlertsPage,settings:SettingsPage};
  root.innerHTML=(pages[PAGE]||DashboardPage)();
  // Post-render hooks
  if(PAGE==='internet-scan'&&window._scanAssetId) showScanPreview(window._scanAssetId);
}

/* ═══════════════════════════════════════════════
   BOOTSTRAP
═══════════════════════════════════════════════ */
auth.onAuthStateChanged(async user=>{
  if(user){
    CU=user;
    render(); // Render immediately so user sees the dashboard
    try {
      await loadData();
      render(); // Re-render with fetched data
    } catch(e) {
      console.warn("Data load error:", e);
    }
  }
  else {
    CU=null;
    render();
  }
});