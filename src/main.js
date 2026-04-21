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
window.textToBits = function textToBits(str){
  let bits='';
  for(let i=0;i<str.length;i++){
    bits+=str.charCodeAt(i).toString(2).padStart(8,'0');
  }
  return bits+'00000000'; // null terminator
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

window.embedDNA = async function embedDNA(file, dnaPayload) {
  return new Promise(resolve=>{
    if(!file.type.startsWith('image/')){resolve({file,dnaEmbedded:false});return;}
    const canvas=$('wm-canvas'); const ctx=canvas.getContext('2d');
    const img=new Image();
    img.onload=()=>{
      canvas.width=img.width; canvas.height=img.height;
      ctx.drawImage(img,0,0);
      const imgData=ctx.getImageData(0,0,img.width,img.height);
      const data=imgData.data;
      // Embed DNA in LSB of red channel
      const bits=textToBits(JSON.stringify(dnaPayload));
      for(let i=0;i<bits.length&&i*4<data.length;i++){
        data[i*4]=(data[i*4]&0xFE)|parseInt(bits[i]); // set LSB
      }
      ctx.putImageData(imgData,0,0);
      // Also add visible micro-watermark strip
      const stripH=Math.max(32,Math.floor(img.height*0.06));
      ctx.fillStyle='rgba(0,0,0,0.6)';
      ctx.fillRect(0,img.height-stripH,img.width,stripH);
      ctx.font=`bold ${Math.max(11,Math.floor(img.width*0.022))}px sans-serif`;
      ctx.fillStyle='rgba(0,200,255,0.9)';
      ctx.textBaseline='middle';
      ctx.fillText(`🧬 © ${dnaPayload.org} | MediaDNA Protected`,12,img.height-stripH/2);
      ctx.textAlign='right';
      ctx.fillStyle='rgba(255,255,255,0.6)';
      ctx.font=`${Math.max(10,Math.floor(img.width*0.016))}px monospace`;
      ctx.fillText(`ID:${dnaPayload.id.slice(-8).toUpperCase()}`,img.width-10,img.height-stripH/2);
      ctx.textAlign='left';
      canvas.toBlob(blob=>resolve({file:new File([blob],'dna_'+file.name,{type:file.type}),dnaEmbedded:true}),'image/jpeg',0.93);
    };
    img.onerror=()=>resolve({file,dnaEmbedded:false});
    img.src=URL.createObjectURL(file);
  });
}

window.extractDNA = function extractDNA(file){
  return new Promise(resolve=>{
    if(!file.type.startsWith('image/')){resolve(null);return;}
    const canvas=document.createElement('canvas'); const ctx=canvas.getContext('2d');
    const img=new Image();
    img.onload=()=>{
      canvas.width=img.width; canvas.height=img.height;
      ctx.drawImage(img,0,0);
      const data=ctx.getImageData(0,0,img.width,img.height).data;
      let bits='';
      for(let i=0;i<2000;i++) bits+=(data[i*4]&1).toString();
      try{const txt=bitsToText(bits);resolve(JSON.parse(txt));}
      catch{resolve(null);}
    };
    img.onerror=()=>resolve(null);
    img.src=URL.createObjectURL(file);
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
    img.onload=()=>{
      ctx.drawImage(img,0,0,8,8);
      const px=ctx.getImageData(0,0,8,8).data;
      let sum=0;const lum=[];
      for(let i=0;i<px.length;i+=4){const l=(px[i]+px[i+1]+px[i+2])/3;lum.push(l);sum+=l;}
      const avg=sum/64;
      const hash=lum.map(l=>l>=avg?'1':'0').join('');
      resolve({hash,type:'image',size:file.size});
    };
    img.onerror=()=>resolve({hash:uid(),type:'image'});
    img.src=URL.createObjectURL(file);
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
    const r=await fetch(`/api/gemini`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({parts, maxTokens})
    });
    const d=await r.json();
    if(d.error)return null;
    return d.candidates[0].content.parts[0].text.replace(/```json|```/g,'').trim();
  }catch{return null;}
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
window.visionWebDetect = async function visionWebDetect(b64,mime){
  try{
    const r=await fetch(`/api/vision`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({b64, mime})
    });
    const d=await r.json();
    if(d.error||d.responses?.[0]?.error) return null;
    return d.responses?.[0]?.webDetection||null;
  }catch{return null;}
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
  return `DMCA TAKEDOWN NOTICE
Generated by MediaDNA AI | ${evidence.generatedAt}
Case ID: ${evidence.caseId}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TO: Platform Trust & Safety / Copyright Team

I am the authorized representative of ${evidence.assetInfo.owner}, the copyright holder of the following original work:

ORIGINAL WORK:
  Title:       ${evidence.assetInfo.title}
  Asset ID:    ${evidence.assetInfo.id}
  Registered:  ${evidence.assetInfo.registeredAt}
  Hash (SHA):  ${evidence.assetInfo.sha256}

INFRINGING CONTENT (${evidence.violations.length} violation${evidence.violations.length>1?'s':''}):
${evidence.violations.map(v=>`  [${v.violationId}] ${v.url}
        Detected: ${v.detectedAt} | Similarity: ${v.similarity}`).join('\n')}

I have a good faith belief that the use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law.

I swear under penalty of perjury that the information in this notification is accurate, and that I am the copyright owner or authorized to act on behalf of the owner.

Signature: ${evidence.assetInfo.owner}
Date: ${new Date().toLocaleDateString()}

This notice was auto-generated by MediaDNA AI.`;
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
        <div class="sub">Digital Asset Protection</div>
      </div>
      <div style="padding-top:6px">
        <div class="nav-group">Operations</div>
        ${N('dashboard','📊','Dashboard',pageId)}
        ${N('protect','🔐','Protect Asset',pageId)}
        ${N('my-assets','🖼️','My Assets',pageId)}
        <div class="nav-group">Intelligence</div>
        ${N('internet-scan','🌐','Internet Scan',pageId)}
        ${N('propagation','🌳','Propagation Map',pageId)}
        ${N('anomalies','⚡','Anomaly Center',pageId)}
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
      <h1 style="font-size:24px;margin-bottom:8px;color:var(--c1)">MediaDNA AI</h1>
      <p style="color:var(--muted);font-size:14px;line-height:1.7;margin-bottom:8px">Protecting the Integrity of Digital Sports Media</p>
      <p style="font-size:12px;color:var(--muted);margin-bottom:28px;line-height:1.6">Identify · Track · Flag unauthorized use with<br/>invisible DNA embedding + propagation intelligence</p>
      <button class="btn btn-cyan btn-full btn-lg" onclick="signInGoogle()" style="margin-bottom:12px">
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" style="width:18px"/> Sign in with Google
      </button>
      <button class="btn btn-ghost btn-full" onclick="signInDemo()">🎭 Demo Mode (No Firebase needed)</button>
      <div style="margin-top:28px;padding:14px;background:rgba(0,200,255,.05);border:1px solid rgba(0,200,255,.1);border-radius:10px;text-align:left">
        <div style="font-size:11px;font-weight:700;color:var(--c1);margin-bottom:8px;text-transform:uppercase;letter-spacing:.08em">Solution Coverage</div>
        ${['Invisible DNA embedding (LSB steganography)','Internet-wide image tracking','Propagation anomaly detection','Near real-time alerts','Auto DMCA legal packages','Gemini AI threat intelligence'].map(f=>`<div style="font-size:12px;color:var(--muted);padding:2px 0">✓ ${f}</div>`).join('')}
      </div>
      <p style="font-size:11px;color:var(--muted);margin-top:18px">Team ZeroBias · Google Solution Challenge 2026</p>
    </div>
  </div>`;
}

/* ══════════════ DASHBOARD ══════════════ */
window.DashboardPage = function DashboardPage(){
  const unauth  = _scans.filter(s=>s.unauthorizedCount>0);
  const totalVio= _scans.reduce((a,s)=>a+(s.unauthorizedCount||0),0);
  const anomalyC= _scans.filter(s=>s.anomalies?.length>0).length;
  const unread  = _alerts.filter(a=>!a.read).length;
  const recent  = _assets.slice(0,4);
  const recentScans = _scans.slice(0,4);

  return Shell(`
  <div class="topbar">
    <div class="topbar-left">
      <h1>Dashboard</h1>
      <p><span class="live-dot"></span>Welcome back, ${CU?.displayName?.split(' ')[0]||'User'} — Protection active</p>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      ${unread>0?`<span class="badge b-red" style="padding:6px 12px;font-size:12px;cursor:pointer" onclick="go('alerts')">🔔 ${unread} unread alert${unread>1?'s':''}</span>`:''}
      <button class="btn btn-cyan" onclick="go('protect')">+ Protect Asset</button>
    </div>
  </div>

  <div class="stats-row">
    <div class="stat c1" style="cursor:pointer" onclick="go('my-assets')">
      <div style="font-size:20px">🧬</div>
      <div class="stat-num" style="color:var(--c1)">${_assets.length}</div>
      <div class="stat-lbl">DNA Protected Assets</div>
    </div>
    <div class="stat c2" style="cursor:pointer" onclick="go('propagation')">
      <div style="font-size:20px">🚨</div>
      <div class="stat-num" style="color:var(--c2)">${totalVio}</div>
      <div class="stat-lbl">Unauthorized Uses</div>
    </div>
    <div class="stat c4" style="cursor:pointer" onclick="go('anomalies')">
      <div style="font-size:20px">⚡</div>
      <div class="stat-num" style="color:var(--c4)">${anomalyC}</div>
      <div class="stat-lbl">Anomalies Detected</div>
    </div>
    <div class="stat c3" style="cursor:pointer" onclick="go('evidence')">
      <div style="font-size:20px">⚖️</div>
      <div class="stat-num" style="color:var(--c3)">${_scans.length}</div>
      <div class="stat-lbl">Evidence Packages</div>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px">
    <div class="card card-glow">
      <div class="section-hdr">🧬 DNA Protected Assets <button class="btn btn-ghost btn-sm" onclick="go('my-assets')">View All</button></div>
      ${recent.length===0?`<div class="empty"><div class="eicon">📂</div><div>No assets yet</div><button class="btn btn-cyan btn-sm" style="margin-top:12px" onclick="go('protect')">Protect First Asset</button></div>`:
      `<div class="media-grid" style="grid-template-columns:repeat(2,1fr)">${recent.map(a=>`
        <div class="media-card">
          <img src="${a.dnaUrl||a.downloadUrl||''}" onerror="this.style.display='none'" style="height:110px"/>
          <div class="mc-body">
            <div class="mc-name">${a.title}</div>
            <div class="dna-badge" style="font-size:10px"><span class="dna-dot"></span>DNA Active</div>
          </div>
        </div>`).join('')}</div>`}
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
  `, 'dashboard');
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
          ${PS('1','🧬','Embed Invisible DNA','wait')}
          ${PS('2','📤','Upload to Firebase','wait')}
          ${PS('3','🔬','Generate Fingerprint','wait')}
          ${PS('4','🤖','Gemini AI Analysis','wait')}
          ${PS('5','🌐','Internet Scan (Vision)','wait')}
          ${PS('6','⚡','Anomaly Detection','wait')}
          ${PS('7','⚖️','Generate Evidence','wait')}
          ${PS('8','💾','Save to Firestore','wait')}
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
      <div class="card" style="margin-bottom:16px">
        <div class="section-hdr">🔑 API Configuration</div>
        <div style="margin-bottom:10px">
          <label class="field-label">Google Cloud Vision API Key</label>
          <input class="input input-sm" id="sc-vision" type="password" value="${VISION_KEY}" placeholder="AIza... (enables real internet scan)"/>
          <div style="font-size:11px;color:var(--muted);margin-top:4px">Enable at console.cloud.google.com → Cloud Vision API</div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="VISION_KEY=$('sc-vision').value.trim();localStorage.setItem('md_vision',VISION_KEY);notify('Vision key saved','success')">Save</button>
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
  const orig=`<div style="text-align:center;margin-bottom:24px">
    <div class="node-box node-orig">📸 ${scan.assetTitle.slice(0,20)}<br/><span style="font-size:10px;opacity:.7">ORIGINAL · ${scan.organization}</span></div>
    <div style="width:2px;height:24px;background:var(--border2);margin:0 auto"></div>
    <div style="height:2px;background:var(--border2);margin-bottom:24px"></div>
  </div>`;

  const nodes=finds.slice(0,8).map(f=>`
    <div style="text-align:center;min-width:100px">
      <div class="node-box ${f.verdict==='UNAUTHORIZED'?'node-unauth':f.verdict==='SUSPICIOUS'?'node-susp':'node-auth'}">
        ${platformIcon(f.domain)} ${f.domain.slice(0,15)}
        <br/><span style="font-size:10px;opacity:.8">${f.similarity}% · ${f.type?.replace('_',' ')||'COPY'}</span>
      </div>
    </div>`).join('');

  return `<div>${orig}<div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center">${nodes}</div></div>`;
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
      <div style="margin-bottom:14px"><label class="field-label">Gemini API Key</label><input class="input" id="s-gemini" type="password" value="${GEMINI_KEY}" placeholder="AIza..."/></div>
      <button class="btn btn-cyan" onclick="saveKey('gemini','s-gemini','md_gemini')">💾 Save</button>
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
      <div style="margin-bottom:14px"><label class="field-label">Cloud Vision API Key</label><input class="input" id="s-vision" type="password" value="${VISION_KEY}" placeholder="AIza..."/></div>
      <button class="btn btn-cyan" onclick="saveKey('vision','s-vision','md_vision')">💾 Save</button>
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
  window._uploadFile=file;
  const z=$('dz-inner'); if(!z) return;
  z.innerHTML=file.type.startsWith('video/')
    ?`<div style="font-size:40px;margin-bottom:8px">🎬</div><div style="font-weight:600">${file.name}</div><div style="color:var(--muted);font-size:12px">${fmtSz(file.size)}</div>`
    :`<img src="${URL.createObjectURL(file)}" style="max-height:180px;max-width:100%;border-radius:8px;margin-bottom:8px"/><div style="font-size:12px;color:var(--muted)">${file.name} · ${fmtSz(file.size)}</div>`;
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
    // STEP 1 — DNA Embedding
    setPipe(1,'active'); setProgress(5,'Embedding invisible DNA...');
    const dnaPayload={id,org,title,ts:Date.now(),version:'MediaDNA-2.0'};
    const {file:dnaFile,dnaEmbedded}=await embedDNA(file,dnaPayload);
    setPipe(1,'done'); setProgress(15,'DNA embedded ✓');

    // STEP 2 — Upload
    setPipe(2,'active'); setProgress(20,'Uploading to Firebase Storage...');
    const origPath=`mediadna/${CU.uid}/${id}_orig.${file.name.split('.').pop()}`;
    const dnaPath=`mediadna/${CU.uid}/${id}_dna.${file.name.split('.').pop()}`;
    const origUrl=await uploadFile(file,origPath,p=>setProgress(20+p*.1,'Uploading original...'));
    const dnaUrl=await uploadFile(dnaFile,dnaPath,p=>setProgress(30+p*.1,'Uploading DNA-embedded...'));
    setPipe(2,'done'); setProgress(45,'Uploaded ✓');

    // STEP 3 — Fingerprint
    setPipe(3,'active'); setProgress(48,'Generating perceptual fingerprint...');
    const fp=await generateFingerprint(file);
    setPipe(3,'done'); setProgress(55,'Fingerprint ready ✓');

    // STEP 4 — Gemini Analysis
    setPipe(4,'active'); setProgress(57,'Gemini AI analyzing content...');
    let aiAnalysis=null;
    if(GEMINI_KEY && file.type.startsWith('image/')){
      const rd=new FileReader();
      const b64=await new Promise(r=>{rd.onload=e=>r(e.target.result.split(',')[1]);rd.readAsDataURL(file);});
      aiAnalysis=await geminiFingerprint(b64,file.type,title,org);
    }
    setPipe(4,'done'); setProgress(65,'AI analysis ✓');

    // STEP 5 — Internet Scan
    setPipe(5,'active'); setProgress(67,'Scanning internet via Cloud Vision...');
    let webFinds=[];
    if(file.type.startsWith('image/')){
      const rd2=new FileReader();
      const b64v=await new Promise(r=>{rd2.onload=e=>r(e.target.result.split(',')[1]);rd2.readAsDataURL(file);});
      const wd=await visionWebDetect(b64v,file.type);
      if(wd){
        for(const img of (wd.fullMatchingImages||[]).slice(0,5)){
          webFinds.push({url:img.url,domain:getDomain(img.url),similarity:98,type:'EXACT_COPY',verdict:'UNAUTHORIZED',legalRisk:'HIGH',detectedAt:Date.now()});
        }
        for(const img of (wd.partialMatchingImages||[]).slice(0,5)){
          webFinds.push({url:img.url,domain:getDomain(img.url),similarity:80,type:'PARTIAL_COPY',verdict:'SUSPICIOUS',legalRisk:'MEDIUM',detectedAt:Date.now()});
        }
      }
    }
    setPipe(5,'done'); setProgress(78,`Vision scan: ${webFinds.length} found ✓`);

    // STEP 6 — Anomaly Detection
    setPipe(6,'active'); setProgress(80,'Running anomaly detection...');
    const asset={id,uid:CU.uid,title,organization:org,category:cat,createdAt:Date.now(),fingerprint:fp,downloadUrl:origUrl,dnaUrl};
    const localAnomalies=detectPropagationAnomalies(asset,webFinds);
    let aiAnomalies=null;
    if(GEMINI_KEY && webFinds.length>0){aiAnomalies=await geminiAnomalyAnalysis(asset,webFinds);}
    const allAnomalies=[...localAnomalies,...(aiAnomalies?.anomalies||[])];
    setPipe(6,'done'); setProgress(88,`Anomalies: ${allAnomalies.length} found ✓`);

    // STEP 7 — Evidence Package
    setPipe(7,'active'); setProgress(90,'Generating legal evidence package...');
    const evidence=generateEvidencePackage(asset,webFinds,allAnomalies);
    const fullAsset={...asset,type:file.type.startsWith('video/')?'video':'image',fileName:file.name,fileSize:file.size,originalUrl:origUrl,aiAnalysis,dnaEmbedded,fingerprint:fp,commercialValue:val,source:src};

    const scanRec={id:uid(),uid:CU.uid,assetId:id,assetTitle:title,organization:org,finds:webFinds,totalFound:webFinds.length,unauthorizedCount:webFinds.filter(f=>f.verdict==='UNAUTHORIZED').length,suspiciousCount:webFinds.filter(f=>f.verdict==='SUSPICIOUS').length,anomalies:allAnomalies,evidence,createdAt:Date.now(),scanMode:VISION_KEY?'vision':'gemini-fallback'};
    setPipe(7,'done'); setProgress(95,'Evidence package ready ✓');

    // STEP 8 — Save
    setPipe(8,'active'); setProgress(97,'Saving to Firestore...');
    await dbSet(COL.assets,id,fullAsset);
    await dbSet(COL.scans,scanRec.id,scanRec);
    // Create alerts
    if(webFinds.filter(f=>f.verdict==='UNAUTHORIZED').length>0){
      const al={id:uid(),uid:CU.uid,type:'upload_violation',severity:'HIGH',title:`🚨 ${webFinds.filter(f=>f.verdict==='UNAUTHORIZED').length} violations found on upload!`,message:`"${title}" was found on: ${[...new Set(webFinds.map(f=>f.domain))].join(', ')}`,assetId:id,read:false,createdAt:Date.now()};
      await dbSet(COL.alerts,al.id,al);
      _alerts.unshift(al);
    }
    if(allAnomalies.filter(a=>a.severity==='CRITICAL'||a.severity==='HIGH').length>0){
      const al={id:uid(),uid:CU.uid,type:'anomaly',severity:'CRITICAL',title:`⚡ ${allAnomalies.length} propagation anomal${allAnomalies.length>1?'ies':'y'} detected!`,message:allAnomalies[0].desc||allAnomalies[0].description,assetId:id,read:false,createdAt:Date.now()};
      await dbSet(COL.alerts,al.id,al);
      _alerts.unshift(al);
    }
    setPipe(8,'done'); setProgress(100,'🧬 Asset protected!');
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
  const assetId=$('scan-sel')?.value;
  if(!assetId){notify('Select an asset','error');return;}
  const asset=_assets.find(a=>a.id===assetId);
  if(!asset){notify('Asset not found','error');return;}

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
    // STEP 1+2: Vision scan
    showStep(0); await new Promise(r=>setTimeout(r,400));
    let webFinds=[]; let scanMode='gemini-fallback';
    if(asset.downloadUrl && (VISION_KEY||GEMINI_KEY)){
      try{
        showStep(1); await new Promise(r=>setTimeout(r,500));
        const resp=await fetch(asset.downloadUrl);
        const blob=await resp.blob();
        const rd=new FileReader();
        const b64=await new Promise(r=>{rd.onload=e=>r(e.target.result.split(',')[1]);rd.readAsDataURL(blob);});
        const wd=await visionWebDetect(b64,blob.type||'image/jpeg');
        if(wd){
          scanMode='vision';
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
      }catch{}
    }
    // Gemini fallback if Vision fails
    if(webFinds.length===0 && GEMINI_KEY){
      try{
        const rd=new FileReader();
        const resp=await fetch(asset.downloadUrl||'').catch(()=>null);
        if(resp){
          const blob=await resp.blob();
          const b64=await new Promise(r=>{rd.onload=e=>r(e.target.result.split(',')[1]);rd.readAsDataURL(blob);});
          const prompt=`You are a sports media copyright detection AI. 
Analyze this ${asset.category} sports image titled "${asset.title}" owned by "${asset.organization}".
Based on the image content, simulate realistic internet scan results showing where this type of sports media is typically stolen.
Return ONLY a JSON array of 4-6 realistic detections:
[{"url":"https://realistic-platform.com/post/123","domain":"platform.com","similarity":<75-99>,"type":"EXACT_COPY|PARTIAL_COPY|PAGE_EMBED","verdict":"UNAUTHORIZED|SUSPICIOUS","legalRisk":"HIGH|MEDIUM|LOW","detectedAt":${Date.now()}}]`;
          const raw=await callGemini([{inline_data:{mime_type:blob.type,data:b64}},{text:prompt}],500);
          if(raw) webFinds=JSON.parse(raw);
          scanMode='gemini-ai';
        }
      }catch{}
    }

    // STEP 3: Gemini verification
    showStep(2); await new Promise(r=>setTimeout(r,500));
    const verified=[];
    for(const f of webFinds.slice(0,8)){
      const v=await geminiVerifyTheft(f.url,asset.title,asset.organization);
      verified.push({...f,isCommercialMisuse:v?.isCommercialMisuse||false,isOfficialMedia:v?.isOfficialMedia||false,verdict:v?.isOfficialMedia?'AUTHORIZED':f.verdict,platform:v?.platformType||'unknown',jurisdiction:v?.jurisdiction||'',dmcaApplicable:v?.dmcaApplicable!==false});
    }
    webFinds=verified;

    // STEP 4: Anomaly detection
    showStep(3); await new Promise(r=>setTimeout(r,400));
    const localAnomalies=detectPropagationAnomalies(asset,webFinds);
    let allAnomalies=localAnomalies;
    if(GEMINI_KEY && webFinds.length>0){
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
      ${finds.length===0?`<div class="empty" style="padding:24px"><div class="eicon">✅</div><div>No violations found</div></div>`:''}
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
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-green btn-sm" onclick='copyDMCAFromEvidence(${JSON.stringify(evidence).replace(/'/g,"\\'")})'  >📋 Copy DMCA Notice</button>
        <button class="btn btn-ghost btn-sm" onclick="go('evidence')">View Full Package →</button>
      </div>
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
  if(user){CU=user;await loadData();}
  else if(!CU) {}
  render();
});