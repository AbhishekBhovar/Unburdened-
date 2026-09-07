
const START=126, GOAL=70, STEP=2.5, $=s=>document.querySelector(s);
const STORE="unburdened-data-v1";
const state=load();

function load(){
  const base={weights:[],waists:[],photos:[],start:START,goal:GOAL,lastCelebrated:START,
    reminders:{weight:true,waist:true,photos:true}};
  try{
    const modern=JSON.parse(localStorage.getItem(STORE)||"null");
    if(modern) return {...base,...modern,reminders:{...base.reminders,...(modern.reminders||{})}};
    const old=JSON.parse(localStorage.getItem("unburdened-v13")||"null");
    if(old) return {...base,...old,reminders:{...base.reminders,...(old.reminders||{})}};
  }catch(e){}
  return base;
}
function save(){localStorage.setItem(STORE,JSON.stringify(state))}
function cur(){return state.weights.length?state.weights.at(-1).value:state.start}
function lost(){return Math.max(0,state.start-cur())}
function rem(){return Math.max(0,cur()-state.goal)}
function fmt(n){return Number(n).toFixed(Number(n)%1?1:0)}
function today(){return new Date().toISOString().slice(0,10)}
function cps(){let a=[126,125],x=122.5;while(x>=70){a.push(x);x-=2.5}return [...new Set(a)].sort((a,b)=>b-a)}
function next(){return cps().find(x=>x<cur())??GOAL}
function nextN(n){return cps().filter(x=>x<cur()).slice(0,n)}
function overall(){return Math.min(100,Math.max(0,lost()/(state.start-state.goal)*100))}
function navActive(v){document.querySelectorAll("#nav button").forEach(b=>b.classList.toggle("active",b.dataset.v===v))}
function go(v){
  navActive(v);
  ({home,log,progress,milestones,more}[v]||home)();
  scrollTo({top:0,behavior:"instant"});
}
document.querySelectorAll("#nav button").forEach(b=>b.onclick=()=>go(b.dataset.v));

function backToMore(){navActive("more");more();scrollTo(0,0)}
function pageHead(title, back=false){
  return `<div class="head">${back?`<button class="back" aria-label="Back" onclick="backToMore()">‹</button>`:""}<h1>${title}</h1>${back?'<span class="head-spacer"></span>':""}</div>`;
}

function home(){
  const w=cur(),targets=nextN(4),n=targets[0]??GOAL;
  const higher=cps().filter(x=>x>=w);
  const stepStart=higher.length?higher.at(-1):state.start;
  const denom=Math.max(.1,stepStart-n);
  const stepPct=Math.min(100,Math.max(0,(stepStart-w)/denom*100));
  const marks=[`<div class="mark current m0">${fmt(w)}<small>YOU ARE HERE</small></div>`];
  ["m1","m2","m3","m4"].forEach((cl,i)=>{
    if(targets[i]!=null) marks.push(`<div class="mark ${i===0?"next":""} ${cl}">${fmt(targets[i])}</div>`)
  });
  $("#view").innerHTML=`
  <section>
    <div class="hero">
      <img class="hero-bg" src="assets/journey-hero.jpg" alt="Mountain path toward a summit">
      <div class="brand"><h1>Unburdened</h1><p>Small steps. Big changes.</p></div>
      <div class="goal"><strong>🚩 ${GOAL} kg</strong><small>THE GOAL</small></div>
      <div class="markers">${marks.join("")}</div>
    </div>
    <div class="home-body">
      <div class="card mission">
        <div class="label">Current Mission</div>
        <div class="route">${fmt(w)} kg → ${fmt(n)} kg</div>
        <div class="progressbar"><i style="width:${stepPct}%"></i></div>
        <div class="split muted mini"><span>${fmt(lost())} kg down</span><span>${fmt(Math.max(0,w-n))} kg to next step</span></div>
      </div>
      <div class="grid3">
        <div class="card stat"><strong>${fmt(w)}</strong><small>Current kg</small></div>
        <div class="card stat"><strong>${fmt(lost())}</strong><small>Total lost</small></div>
        <div class="card stat"><strong>${fmt(rem())}</strong><small>To goal</small></div>
      </div>
      <div class="card soft quote">“Progress, not perfection.”</div>
    </div>
  </section>`;
}

function log(){
  $("#view").innerHTML=`<section class="screen">
    ${pageHead("Log Weight")}
    <div class="scale" aria-hidden="true"></div>
    <div class="card form">
      <label>Date</label><input id="date" type="date" value="${today()}">
      <label>Weight (kg)</label><input id="weight" type="number" step=".1" inputmode="decimal" placeholder="${fmt(cur())}">
      <div class="helper">✓ Same time and conditions each week makes the trend more useful.</div>
      <label>Waist (cm) <span class="muted">— optional, every 2 weeks</span></label>
      <input id="waist" type="number" step=".1" inputmode="decimal" placeholder="e.g. 110">
      <label>Notes <span class="muted">— optional</span></label>
      <textarea id="notes" placeholder="Anything worth remembering?"></textarea>
      <button id="saveLog" class="btn">Save Update</button>
    </div>
    <div class="notice">💡 One reading is data. The trend is progress.</div>
  </section>`;
  $("#saveLog").onclick=()=>{
    const v=parseFloat($("#weight").value),wa=parseFloat($("#waist").value),d=$("#date").value,notes=$("#notes").value.trim();
    if(!Number.isNaN(v)){state.weights.push({date:d,value:v,notes});checkCelebration(v)}
    if(!Number.isNaN(wa))state.waists.push({date:d,value:wa});
    save();go("home")
  };
}

function progress(){
  const w=cur();
  $("#view").innerHTML=`<section class="screen">
    ${pageHead("Current Progress")}
    <div class="card center">
      <div class="big">${fmt(w)} kg</div><h2>${fmt(lost())} kg down</h2><p class="muted">${fmt(rem())} kg to go</p>
      <div class="progressbar"><i style="width:${overall()}%"></i></div>
      <div class="split muted mini"><span>${state.start} kg Start</span><span>${state.goal} kg Goal</span></div>
    </div>
    <div class="card soft center"><strong>Next checkpoint</strong><div class="big checkpoint">${fmt(next())} kg</div><div class="muted">${fmt(Math.max(0,w-next()))} kg to go</div></div>
    ${chart()}
    ${waistSummary()}
    <div class="card soft quote">Individual numbers can bounce. The direction over time is what matters.</div>
  </section>`;
}
function waistSummary(){
  if(!state.waists.length) return `<div class="card"><h2>Waist</h2><p class="muted">No waist measurements yet. Add one every two weeks if you want a second objective trend.</p></div>`;
  const first=state.waists[0].value,last=state.waists.at(-1).value;
  return `<div class="card"><h2>Waist</h2><div class="split"><strong>${fmt(last)} cm</strong><span class="muted">${fmt(first-last)} cm change</span></div></div>`;
}
function chart(){
  const vals=state.weights.slice(-12);
  if(vals.length<2) return `<div class="card"><h2>Weight trend</h2><div class="chart"><div class="chart-empty">Your trend appears after two weigh-ins.<br>One reading never tells the whole story.</div></div></div>`;
  const min=Math.min(...vals.map(x=>x.value)),max=Math.max(...vals.map(x=>x.value));
  const pad=Math.max(1,(max-min)*.18),lo=min-pad,hi=max+pad;
  const pts=vals.map((x,i)=>`${(i/(vals.length-1))*100},${95-((x.value-lo)/(hi-lo||1))*88}`).join(" ");
  return `<div class="card"><h2>Weight trend</h2><div class="chart"><svg viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="#27a879" stroke-width="2.5" vector-effect="non-scaling-stroke"/></svg></div></div>`;
}

function milestones(){
  $("#view").innerHTML=`<section class="screen">
    ${pageHead("Milestones")}
    <div class="tabs"><button id="allSteps" class="active">All Steps</button><button id="keySteps">Key Milestones</button></div>
    <div id="milestoneList"></div>
  </section>`;
  renderMilestones(false);
  $("#allSteps").onclick=()=>{setMilestoneTab(false)};
  $("#keySteps").onclick=()=>{setMilestoneTab(true)};
}
function setMilestoneTab(key){
  $("#allSteps").classList.toggle("active",!key);$("#keySteps").classList.toggle("active",key);renderMilestones(key)
}
function renderMilestones(key){
  const w=cur();
  let arr=cps();
  if(key) arr=arr.filter(x=>x===126||x===125||x===120||x%10===0||x===70);
  // show journey in descending order, starting from the user's current region rather than goal-first
  $("#milestoneList").innerHTML=`<div class="card timeline">${arr.map(x=>{
    const done=w<=x, cc=next()===x, major=x%10===0||x===120, goal=x===state.goal;
    return `<div class="mile ${done?"done":""} ${cc?"current":""} ${major?"major":""} ${goal?"goal":""}">
      <strong>${fmt(x)} kg</strong>
      <small>${x===state.start?"Starting point":goal?"Goal":done?`${fmt(state.start-x)} kg lost`:`${fmt(w-x)} kg to go`}</small>
    </div>`
  }).join("")}</div>`;
  setTimeout(()=>{
    const el=$("#milestoneList .current"); if(el) el.scrollIntoView({block:"center"});
  },0);
}

function more(){
  $("#view").innerHTML=`<section class="screen">
    ${pageHead("More")}
    <div class="card identity">
      <img class="logo-preview" src="assets/unburdened-logo.png" alt="Unburdened logo">
      <div><strong>Unburdened</strong><span>Less weight. More life.</span></div>
    </div>
    <button class="menu-card" onclick="photosPage()"><span class="menu-icon">▧</span><span><strong>Progress Photos</strong><small>Front • side • back every 4 weeks</small></span><b>›</b></button>
    <button class="menu-card" onclick="settingsPage()"><span class="menu-icon">⚙</span><span><strong>Settings</strong><small>Goals and reminders</small></span><b>›</b></button>
    <button class="menu-card" onclick="dataPage()"><span class="menu-icon">⇩</span><span><strong>Your Data</strong><small>Export or restore a backup</small></span><b>›</b></button>
  </section>`;
}

function photosPage(){
  navActive("more");
  $("#view").innerHTML=`<section class="screen">
    ${pageHead("Progress Photos",true)}
    <div class="card photo-intro"><p>Front • side • back</p><small class="muted">About every 4 weeks, with similar lighting, distance and clothing.</small><button id="addPhotos" class="btn">+ Add Photos</button></div>
    <div id="photosList">${photos()}</div>
  </section>`;
  $("#addPhotos").onclick=()=>$("#photoPicker").click();
  scrollTo(0,0);
}
function photos(){
  if(!state.photos.length) return `<div class="card empty-state"><div class="camera">▣</div><strong>No progress photos yet</strong><p class="muted">Your first set will appear here as three matching panels.</p></div>`;
  return state.photos.slice().reverse().map(p=>`<div class="card photo-group"><div class="photo-date">${friendlyDate(p.date)}</div><div class="photo-grid">${p.images.map((i,idx)=>`<figure><img src="${i}" alt="${["Front","Side","Back"][idx]||"Progress"} photo"><figcaption>${["Front","Side","Back"][idx]||""}</figcaption></figure>`).join("")}</div></div>`).join("");
}
function friendlyDate(s){try{return new Date(s+"T12:00:00").toLocaleDateString(undefined,{month:"short",year:"numeric"})}catch{return s}}

function settingsPage(){
  navActive("more");
  $("#view").innerHTML=`<section class="screen">
    ${pageHead("Settings",true)}
    <div class="card"><h2>My Goals</h2>
      <div class="row"><span>Starting weight</span><strong>${state.start.toFixed(1)} kg</strong></div>
      <div class="row"><span>Ultimate goal</span><strong>${state.goal.toFixed(1)} kg</strong></div>
      <div class="row"><span>Checkpoint size</span><strong>${STEP} kg</strong></div>
    </div>
    <div class="card"><h2>Reminders</h2>
      ${toggleRow("weight","Weekly weigh-in","Once each week")}
      ${toggleRow("waist","Waist measurement","Every 2 weeks")}
      ${toggleRow("photos","Progress photos","Every 4 weeks")}
    </div>
    <div class="card soft quote">The app tracks the journey. A single reading never gets to define it.</div>
  </section>`;
  document.querySelectorAll("[data-reminder]").forEach(el=>el.onchange=e=>{state.reminders[e.target.dataset.reminder]=e.target.checked;save()});
  scrollTo(0,0);
}
function toggleRow(id,title,sub){return `<label class="toggle-row"><span><strong>${title}</strong><small>${sub}</small></span><input data-reminder="${id}" type="checkbox" ${state.reminders[id]?"checked":""}><i></i></label>`}

function dataPage(){
  navActive("more");
  $("#view").innerHTML=`<section class="screen">
    ${pageHead("Your Data",true)}
    <div class="card"><h2>Backup</h2><p class="muted">Your entries are stored on this device. Export a backup before clearing browser data or changing devices.</p>
      <div class="backup"><button id="export" class="btn light">Export</button><button id="importBtn" class="btn light">Import</button></div>
      <input id="importFile" type="file" accept="application/json" hidden>
    </div>
  </section>`;
  $("#export").onclick=exportSave;$("#importBtn").onclick=()=>$("#importFile").click();$("#importFile").onchange=importSave;scrollTo(0,0)
}

$("#photoPicker").onchange=async e=>{
  const files=[...e.target.files].slice(0,3); if(!files.length)return;
  const images=await Promise.all(files.map(resize));
  state.photos.push({date:today(),images});save();photosPage();e.target.value="";
};
function resize(f){return new Promise(resolve=>{const r=new FileReader();r.onload=()=>{const im=new Image;im.onload=()=>{const c=document.createElement("canvas"),s=Math.min(1,900/im.width);c.width=im.width*s;c.height=im.height*s;c.getContext("2d").drawImage(im,0,0,c.width,c.height);resolve(c.toDataURL("image/jpeg",.82))};im.src=r.result};r.readAsDataURL(f)})}

function checkCelebration(v){
  const hits=cps().filter(x=>v<=x&&state.lastCelebrated>x);if(!hits.length)return;
  const hit=Math.min(...hits);state.lastCelebrated=hit;save();setTimeout(()=>celebrate(hit),80)
}
function celebrate(hit){
  const o=$("#celebrate");o.classList.remove("hidden");
  o.innerHTML=`<div class="celebrate-box"><div class="confetti">◆ ✦ ● ✦ ◆</div><h1>Checkpoint Reached!</h1><div class="flag-rock">🚩</div><div class="kg">${fmt(hit)} kg</div><h2>${fmt(state.start-hit)} kg down</h2><p class="muted">${fmt(hit-state.goal)} kg to go</p><div class="card soft">Another step unlocked. Keep going.</div><button class="btn" onclick="document.getElementById('celebrate').classList.add('hidden')">Continue</button></div>`
}
function exportSave(){const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`unburdened-save-${today()}.json`;a.click();URL.revokeObjectURL(a.href)}
function importSave(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{Object.assign(state,JSON.parse(r.result));save();dataPage();alert("Backup restored.")}catch{alert("That save file could not be read.")}};r.readAsText(f)}

home();
if("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js");
