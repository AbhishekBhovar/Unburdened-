const START=126, GOAL=70, STEP=2.5, $=s=>document.querySelector(s);const STORE="unburdened-data-v1";const state=load();let chartRange="ALL";
function load(){const base={weights:[],waists:[],photos:[],start:START,goal:GOAL,lastCelebrated:START,reminders:{weight:true,waist:true,photos:true}};try{const a=JSON.parse(localStorage.getItem(STORE)||"null");return a?{...base,...a,reminders:{...base.reminders,...(a.reminders||{})}}:base}catch{return base}}
function save(){localStorage.setItem(STORE,JSON.stringify(state))}
function weightRows(){
  return (state.weights||[])
    .map((x,i)=>({...x,_i:i,value:Number(x.value),ts:x.date?new Date(x.date+'T12:00:00').getTime():NaN}))
    .filter(x=>Number.isFinite(x.value)&&Number.isFinite(x.ts))
    .sort((a,b)=>a.ts-b.ts||a._i-b._i)
}
function latestWeightRow(){const a=weightRows();return a.length?a.at(-1):null}
function cur(){const x=latestWeightRow();return x?x.value:state.start}
function lost(){return Math.max(0,state.start-cur())}
function rem(){return Math.max(0,cur()-state.goal)}
function fmt(n){return Number(n).toFixed(Number(n)%1?1:0)}
function today(){return new Date().toISOString().slice(0,10)}
function cps(){let a=[126,125],x=122.5;while(x>=70){a.push(x);x-=2.5}return [...new Set(a)].sort((a,b)=>b-a)}function next(){return cps().find(x=>x<cur())??GOAL}function overall(){return Math.min(100,Math.max(0,lost()/(state.start-state.goal)*100))}
function navActive(v){document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('active',b.dataset.v===v))}function go(v){navActive(v);({home,log,progress,milestones,more}[v]||home)();scrollTo(0,0)}document.querySelectorAll('#nav button').forEach(b=>b.onclick=()=>go(b.dataset.v));
function pageHead(title,back=false){return `<div class="head">${back?`<button class="back" aria-label="Back">‹</button>`:''}<h1>${title}</h1></div>`}function wireBack(){const b=$('.back');if(b)b.onclick=()=>go('more')}
function trailSteps(w){const all=cps().filter(x=>x<w);return all.slice(0,6)}
function home(){
  const w=cur(),n=next();
  const hi=cps().filter(x=>x>=w).at(-1)??START;
  const pct=Math.max(0,Math.min(100,(hi-w)/Math.max(.1,hi-n)*100));
  $('#view').innerHTML=`<section class="home-page static-home">
    <div class="static-journey-art">
      <img src="unburdened-journey.jpeg?v=28"
           alt="Unburdened mountain journey with static milestone stones from 126 kg toward the 70 kg goal">
    </div>
    <div class="home-body">
      <div class="card mission">
        <div class="mission-label">Current Mission</div>
        <div class="route">${fmt(w)} kg → ${fmt(n)} kg</div>
        <div class="progressbar"><i style="width:${pct}%"></i></div>
        <div class="split muted mini">
          <span>${fmt(Math.max(0,130-w))} kg down</span>
          <span>${fmt(Math.max(0,w-n))} kg to next step</span>
        </div>
      </div>
    </div>
  </section>`
}
function log(){$('#view').innerHTML=`<section class="screen log-screen">${pageHead('Log Weight')}<div class="scale" aria-hidden="true"></div><div class="card form compact-form"><div class="two"><label>Date<input id="date" type="date" value="${today()}"></label><label>Weight (kg)<input id="weight" type="number" step=".1" inputmode="decimal" placeholder="${fmt(cur())}"></label></div><div class="helper">✓ Same conditions each week makes the trend more useful.</div><label>Waist (cm) <span>— optional, every 2 weeks</span><input id="waist" type="number" step=".1" inputmode="decimal" placeholder="e.g. 110"></label><label>Notes <span>— optional</span><textarea id="notes" placeholder="Anything worth remembering?"></textarea></label><button id="saveLog" class="btn">Save Update</button></div></section>`;$('#saveLog').onclick=()=>{const v=parseFloat($('#weight').value),wa=parseFloat($('#waist').value),d=$('#date').value,notes=$('#notes').value.trim();if(!Number.isNaN(v)){const priorLatest=latestWeightRow();state.weights.push({date:d,value:v,notes});const afterLatest=latestWeightRow();if(afterLatest&&afterLatest._i===state.weights.length-1&&(!priorLatest||afterLatest.ts>=priorLatest.ts))checkCelebration(v)}if(!Number.isNaN(wa))state.waists.push({date:d,value:wa});save();go('home')}}
function progress(){$('#view').innerHTML=`<section class="screen progress-screen">${pageHead('Current Progress')}<div class="card center progress-summary"><div class="big">${fmt(cur())} kg</div><h2>${fmt(lost())} kg down</h2><p class="muted">${fmt(rem())} kg to go</p><div class="progressbar"><i style="width:${overall()}%"></i></div><div class="split muted mini"><span>${START} kg Start</span><span>${GOAL} kg Goal</span></div></div><div class="card soft center checkpoint-card"><strong>Next Checkpoint</strong><div class="checkpoint">${fmt(next())} kg</div><span class="muted">${fmt(Math.max(0,cur()-next()))} kg to go</span></div>${chart()}${waistSummary()}</section>`}
function setChartRange(r){chartRange=r;progress()}
function chart(){
  const sorted=weightRows();
  const byDate=new Map();
  sorted.forEach(x=>byDate.set(x.date,x)); // if same date is entered twice, newest entry for that date wins
  const all=[...byDate.values()].sort((a,b)=>a.ts-b.ts);
  if(all.length<2)return `<div class="card trend-card"><div class="trend-head"><div><h2>Weight trend</h2><p>Your progress over time</p></div></div><div class="trend-empty">Your trend appears after two dated weigh-ins.<br>One reading never tells the whole story.</div></div>`;

  const lastTs=all.at(-1).ts;
  const rangeDays={ '1W':7, '1M':31, '3M':92 };
  const startTs=chartRange==='ALL' ? all[0].ts : lastTs-rangeDays[chartRange]*86400000;
  let v=all.filter(x=>x.ts>=startTs);
  if(v.length<2)v=all.slice(-Math.min(2,all.length));

  const W=340,H=220,L=42,R=10,T=18,B=34,plotW=W-L-R,plotH=H-T-B;
  let min=Math.min(...v.map(x=>x.value)),max=Math.max(...v.map(x=>x.value));
  let span=Math.max(2,max-min);
  let pad=Math.max(1,span*.22);
  let lo=Math.floor((min-pad)/2)*2, hi=Math.ceil((max+pad)/2)*2;
  if(hi-lo<6){const mid=(hi+lo)/2;lo=mid-3;hi=mid+3}
  const firstTs=v[0].ts, timeSpan=Math.max(86400000,v.at(-1).ts-firstTs);
  const x=x=>L+((x.ts-firstTs)/timeSpan)*plotW;
  const y=x=>T+((hi-x.value)/(hi-lo))*plotH;
  const pts=v.map(p=>`${x(p).toFixed(1)},${y(p).toFixed(1)}`).join(' ');
  const area=`${x(v[0]).toFixed(1)},${(T+plotH).toFixed(1)} ${pts} ${x(v.at(-1)).toFixed(1)},${(T+plotH).toFixed(1)}`;
  const yTicks=4;
  const yGrid=Array.from({length:yTicks+1},(_,i)=>{
    const yy=T+(plotH/yTicks)*i;
    const val=hi-((hi-lo)/yTicks)*i;
    return `<line x1="${L}" y1="${yy}" x2="${W-R}" y2="${yy}" class="grid-line"/><text x="${L-7}" y="${yy+4}" text-anchor="end" class="axis-text">${fmt(val)}</text>`
  }).join('');

  const labelCount=Math.min(6,v.length);
  const labelIdx=[...new Set(Array.from({length:labelCount},(_,i)=>Math.round(i*(v.length-1)/Math.max(1,labelCount-1))))];
  const spansYears=new Date(v[0].ts).getFullYear()!==new Date(v.at(-1).ts).getFullYear();
  const fmtDate=ts=>new Date(ts).toLocaleDateString(undefined,{day:'numeric',month:'short',year:spansYears?'2-digit':undefined});
  const xLabels=labelIdx.map(i=>`<text x="${x(v[i])}" y="${H-9}" text-anchor="${i===0?'start':i===v.length-1?'end':'middle'}" class="axis-text x-label">${fmtDate(v[i].ts)}</text>`).join('');
  const pointDots=v.map((p,i)=>`<circle cx="${x(p)}" cy="${y(p)}" r="${i===v.length-1?5.5:3.7}" class="${i===v.length-1?'last-dot':'trend-dot'}"/>`).join('');
  const latest=v.at(-1), lx=x(latest), ly=y(latest);
  const bubbleW=92,bubbleH=43;
  const bx=Math.min(W-R-bubbleW,Math.max(L,lx-bubbleW+14));
  const by=Math.max(2,ly-bubbleH-14);
  const bubble=`<g class="latest-bubble"><rect x="${bx}" y="${by}" width="${bubbleW}" height="${bubbleH}" rx="8"/><text x="${bx+8}" y="${by+17}" class="bubble-main">${fmt(latest.value)} kg</text><text x="${bx+8}" y="${by+33}" class="bubble-sub">${new Date(latest.ts).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'})}</text><line x1="${lx}" y1="${by+bubbleH}" x2="${lx}" y2="${ly-7}" class="bubble-line"/></g>`;

  return `<div class="card trend-card">
    <div class="trend-head">
      <div><h2>Weight trend</h2><p>Your progress over time</p></div>
      <div class="range-tabs">${['1W','1M','3M','ALL'].map(r=>`<button class="${chartRange===r?'active':''}" onclick="setChartRange('${r}')">${r}</button>`).join('')}</div>
    </div>
    <div class="trend-chart">
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Weight trend chart">
        <defs><linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#2ebf8c" stop-opacity=".26"/><stop offset="100%" stop-color="#2ebf8c" stop-opacity=".03"/></linearGradient></defs>
        ${yGrid}
        <polygon points="${area}" fill="url(#trendFill)"/>
        <polyline points="${pts}" fill="none" class="trend-line"/>
        ${pointDots}
        ${bubble}
        ${xLabels}
      </svg>
    </div>
    <div class="trend-stats">
      <div><strong>${fmt(START)} kg</strong><small>Starting<br>Weight</small></div>
      <div><strong>${fmt(cur())} kg</strong><small>Current<br>Weight</small></div>
      <div><strong class="green-stat">${fmt(lost())} kg</strong><small>Total Lost</small></div>
      <div><strong>${fmt(rem())} kg</strong><small>Remaining</small></div>
    </div>
  </div>`
}
function waistSummary(){if(!state.waists.length)return `<div class="card"><h2>Waist</h2><p class="muted">No waist measurements yet.</p></div>`;const a=state.waists[0].value,b=state.waists.at(-1).value;return `<div class="card"><h2>Waist</h2><div class="split"><strong>${fmt(b)} cm</strong><span class="muted">${fmt(a-b)} cm change</span></div></div>`}
function milestones(){$('#view').innerHTML=`<section class="screen">${pageHead('Milestones')}<div id="milestoneList"></div></section>`;renderMilestones()}
function renderMilestones(){const arr=cps(),w=cur(),majorSet=new Set([120,110,100,90,80]);$('#milestoneList').innerHTML=`<div class="card timeline">${arr.map(x=>{const isMajor=majorSet.has(x),isGoal=x===70,isCurrent=next()===x,isDone=w<=x;return `<div class="mile ${isDone?'done':''} ${isCurrent?'current':''} ${isMajor?'major-mile':''} ${isGoal?'goal-mile':''}"><span class="mile-marker">${isGoal?'🏆':isMajor?'⚑':''}</span><strong>${fmt(x)} kg</strong>${isMajor?'<em>Major Milestone</em>':isGoal?'<em>Goal</em>':''}<small>${x===126?'Starting point':isGoal?'Goal':isDone?`${fmt(START-x)} kg lost`:`${fmt(w-x)} kg to go`}</small></div>`}).join('')}</div>`}
function more(){$('#view').innerHTML=`<section class="screen">${pageHead('More')}<div class="card identity"><img src="assets/more-journey.png?v=30" alt="You looking toward the mountain summit"><div><strong>Unburdened</strong><span>Less weight. More life.</span></div></div><button class="menu-card" id="photosBtn"><span>▧</span><div><strong>Progress Photos</strong><small>Front • side • back every 4 weeks</small></div><b>›</b></button><button class="menu-card" id="settingsBtn"><span>⚙</span><div><strong>Settings</strong><small>Goals and reminders</small></div><b>›</b></button><button class="menu-card" id="dataBtn"><span>⇩</span><div><strong>Your Data</strong><small>Export or restore a backup</small></div><b>›</b></button></section>`;$('#photosBtn').onclick=photosPage;$('#settingsBtn').onclick=settingsPage;$('#dataBtn').onclick=dataPage}
function photosPage(){navActive('more');$('#view').innerHTML=`<section class="screen">${pageHead('Progress Photos',true)}<div class="card photo-intro"><strong>Front • side • back</strong><p class="muted">About every 4 weeks, with similar lighting and distance.</p><button id="addPhotos" class="btn">+ Add Photos</button></div><div>${photos()}</div></section>`;wireBack();$('#addPhotos').onclick=()=>$('#photoPicker').click()}
function photos(){if(!state.photos.length)return `<div class="card empty-state"><strong>No progress photos yet</strong><p class="muted">Your first set will appear here.</p></div>`;return state.photos.slice().reverse().map(p=>`<div class="card"><strong>${new Date(p.date+'T12:00').toLocaleDateString(undefined,{month:'short',year:'numeric'})}</strong><div class="photo-grid">${p.images.map((x,i)=>`<figure><img src="${x}"><figcaption>${['Front','Side','Back'][i]||''}</figcaption></figure>`).join('')}</div></div>`).join('')}
function settingsPage(){navActive('more');$('#view').innerHTML=`<section class="screen">${pageHead('Settings',true)}<div class="card"><h2>My Goals</h2><div class="row"><span>Starting weight</span><strong>${START.toFixed(1)} kg</strong></div><div class="row"><span>Ultimate goal</span><strong>${GOAL.toFixed(1)} kg</strong></div><div class="row"><span>Checkpoint size</span><strong>${STEP} kg</strong></div></div><div class="card"><h2>Reminders</h2>${toggle('weight','Weekly weigh-in','Once each week')}${toggle('waist','Waist measurement','Every 2 weeks')}${toggle('photos','Progress photos','Every 4 weeks')}</div></section>`;wireBack();document.querySelectorAll('[data-r]').forEach(x=>x.onchange=e=>{state.reminders[e.target.dataset.r]=e.target.checked;save()})}
function toggle(id,a,b){return `<label class="toggle-row"><div><strong>${a}</strong><small>${b}</small></div><input data-r="${id}" type="checkbox" ${state.reminders[id]?'checked':''}><i></i></label>`}
function dataPage(){navActive('more');const rows=weightRows().slice().reverse();const history=rows.length?rows.map(x=>`<div class="history-row"><div><strong>${new Date(x.date+'T12:00:00').toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'})}</strong>${x.notes?`<small>${escapeHtml(x.notes)}</small>`:''}</div><b>${fmt(x.value)} kg</b></div>`).join(''):`<p class="muted">No weight entries yet.</p>`;$('#view').innerHTML=`<section class="screen">${pageHead('Your Data',true)}<div class="card"><h2>Backup</h2><p class="muted">Your backup includes your full dated weight log, waist measurements, photos and settings. Export before clearing browser data or changing devices.</p><div class="backup"><button id="export" class="btn light">Export</button><button id="importBtn" class="btn light">Import</button></div><input id="importFile" type="file" accept="application/json" hidden></div><div class="card history-card"><h2>Weight History</h2><p class="muted history-intro">Every dated weight saved in your log.</p><div class="history-list">${history}</div></div></section>`;wireBack();$('#export').onclick=exportSave;$('#importBtn').onclick=()=>$('#importFile').click();$('#importFile').onchange=importSave}
function escapeHtml(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
$('#photoPicker').onchange=async e=>{const f=[...e.target.files].slice(0,3);if(!f.length)return;const images=await Promise.all(f.map(resize));state.photos.push({date:today(),images});save();photosPage();e.target.value=''};function resize(f){return new Promise(r=>{const fr=new FileReader();fr.onload=()=>{const im=new Image;im.onload=()=>{const c=document.createElement('canvas'),s=Math.min(1,900/im.width);c.width=im.width*s;c.height=im.height*s;c.getContext('2d').drawImage(im,0,0,c.width,c.height);r(c.toDataURL('image/jpeg',.82))};im.src=fr.result};fr.readAsDataURL(f)})}
function checkCelebration(v){const h=cps().filter(x=>v<=x&&state.lastCelebrated>x);if(!h.length)return;const hit=Math.min(...h);state.lastCelebrated=hit;save();setTimeout(()=>celebrate(hit),50)}function celebrate(hit){const o=$('#celebrate');o.classList.remove('hidden');o.innerHTML=`<div class="celebrate-box"><div class="confetti">◆ ✦ ● ✦ ◆</div><h1>Checkpoint Reached!</h1><div class="flag-rock">🚩</div><div class="kg">${fmt(hit)} kg</div><h2>${fmt(START-hit)} kg down</h2><p>${fmt(hit-GOAL)} kg to go</p><button class="btn" id="closeCelebration">Continue</button></div>`;$('#closeCelebration').onclick=()=>o.classList.add('hidden')}
function exportSave(){const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`unburdened-save-${today()}.json`;a.click();URL.revokeObjectURL(a.href)}function importSave(e){const f=e.target.files[0];if(!f)return;const r=new FileReader;r.onload=()=>{try{Object.assign(state,JSON.parse(r.result));save();dataPage();alert('Backup restored.')}catch{alert('That save file could not be read.')}};r.readAsText(f)}
function runSplash(){const s=$('#splash');if(!s)return;document.body.classList.add('splashing');requestAnimationFrame(()=>s.classList.add('play'));setTimeout(()=>s.classList.add('leave'),2050);setTimeout(()=>{s.remove();document.body.classList.remove('splashing')},2480)}
home();runSplash();if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');