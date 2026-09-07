
const START=126, GOAL=70, STEP=2.5;
const $=s=>document.querySelector(s);
const state=load();

function load(){
  const base={weights:[],waists:[],photos:[],start:START,goal:GOAL,lastCelebrated:START};
  try{return {...base,...JSON.parse(localStorage.getItem("mountainJourney")||"{}")}}catch{return base}
}
function save(){localStorage.setItem("mountainJourney",JSON.stringify(state))}
function currentWeight(){return state.weights.length?state.weights[state.weights.length-1].value:state.start}
function lost(){return Math.max(0,state.start-currentWeight())}
function remaining(){return Math.max(0,currentWeight()-state.goal)}
function checkpoints(){
  let a=[START,125], x=122.5;
  while(x>=GOAL){a.push(x);x-=STEP}
  return [...new Set(a)].sort((a,b)=>b-a);
}
function reachedFor(w){return checkpoints().filter(x=>w<=x)}
function nextCheckpoint(){
  const w=currentWeight(), cp=checkpoints().filter(x=>x<w);
  return cp.length?Math.max(...cp):GOAL;
}
function pct(){return Math.min(100,Math.max(0,(lost()/(state.start-state.goal))*100))}
function fmt(n){return Number(n).toFixed(Number(n)%1?1:0)}
function dateStr(d=new Date()){return d.toISOString().slice(0,10)}
function setView(name){
  document.querySelectorAll(".nav-btn").forEach(b=>b.classList.toggle("active",b.dataset.view===name));
  ({home,log,progress,milestones,more}[name]||home)();
  scrollTo(0,0);
}
document.querySelectorAll(".nav-btn").forEach(b=>b.onclick=()=>setView(b.dataset.view));

function home(){
 const w=currentWeight(), n=nextCheckpoint(), cps=checkpoints(), idx=Math.max(0,cps.indexOf(n));
 const shown=[cps[idx+2],cps[idx+1],n,cps[idx-1],cps[idx-2]].filter(x=>x!==undefined);
 $("#view").innerHTML=`
 <section>
  <div class="journey-hero">
   <div class="sun"></div><div class="mountain"></div><div class="hill a"></div><div class="hill b"></div>
   <div style="position:absolute;left:18px;top:18px"><h1>My Journey</h1><p class="sub">Small steps. Big changes.</p></div>
   <div class="goal-flag">🚩<b>${state.goal} kg</b><span>THE GOAL</span></div>
   <div class="path">
    <div class="stone done s1">✓ ${fmt(Math.min(START,125))}</div>
    <div class="stone current s2">${fmt(w)}<br><small>YOU ARE HERE</small></div>
    <div class="stone next s3">${fmt(n)}</div>
    <div class="stone s4">${fmt(shown[3]??Math.max(state.goal,n-STEP))}</div>
    <div class="stone s5">${fmt(shown[4]??Math.max(state.goal,n-STEP*2))}</div>
   </div>
   <div class="character">🥾</div>
  </div>
  <div class="home-content">
   <div class="card">
    <div class="mission">Current Mission<br>${fmt(w)} kg → ${fmt(n)} kg</div>
    <div class="progressbar"><i style="width:${Math.min(100,Math.max(0,((w-n===0?1:(Math.ceil((START-w)/STEP)*STEP-(w-n))/(STEP||1)))*100))}%"></i></div>
    <div class="mission-row"><span>${fmt(lost())} kg down</span><span>${fmt(w-n)} kg to next step</span></div>
   </div>
   <div class="grid3">
    <div class="card stat"><strong>${fmt(w)}</strong><small>Current kg</small></div>
    <div class="card stat"><strong>${fmt(lost())}</strong><small>Total lost</small></div>
    <div class="card stat"><strong>${fmt(remaining())}</strong><small>To goal</small></div>
   </div>
   <div class="card soft quote">“Progress, not perfection.”</div>
  </div>
 </section>`;
}
function log(){
 $("#view").innerHTML=`<section class="screen">
  <div class="header"><h1>Log Update</h1></div>
  <div class="segment"><button class="active">Weight</button><button onclick="document.getElementById('waist').focus()">Waist</button><button onclick="document.getElementById('notes').focus()">Notes</button></div>
  <div class="card form">
   <label>Date</label><input id="date" type="date" value="${dateStr()}">
   <label>Weight (kg)</label><input id="weight" inputmode="decimal" type="number" step=".1" placeholder="${fmt(currentWeight())}">
   <div class="card soft">✓ Same time, same conditions for the most useful trend.</div>
   <label>Waist (cm) <small>— optional, every 2 weeks</small></label><input id="waist" inputmode="decimal" type="number" step=".1" placeholder="e.g. 110">
   <label>Notes (optional)</label><textarea id="notes" placeholder="How are you feeling? Anything to note?"></textarea>
   <button class="primary" id="saveLog">Save Update</button>
  </div>
  <div class="card soft quote">Focus on the trend, not a single number.</div>
 </section>`;
 $("#saveLog").onclick=()=>{
   const v=parseFloat($("#weight").value), waist=parseFloat($("#waist").value), date=$("#date").value, notes=$("#notes").value.trim();
   if(!Number.isNaN(v)){state.weights.push({date,value:v,notes}); checkCelebration(v)}
   if(!Number.isNaN(waist))state.waists.push({date,value:waist});
   save(); setView("home");
 };
}
function progress(){
 const w=currentWeight();
 $("#view").innerHTML=`<section class="screen">
  <div class="header"><h1>Current Progress</h1></div>
  <div class="card center">
   <div class="big-number">${fmt(w)} kg</div><h2>${fmt(lost())} kg down</h2><p>${fmt(remaining())} kg to go</p>
   <div class="progressbar"><i style="width:${pct()}%"></i></div>
   <div class="mission-row"><span>${state.start} kg Start</span><span>${state.goal} kg Goal</span></div>
  </div>
  <div class="card next"><h2>Next checkpoint</h2><div class="big-number" style="font-size:34px">${fmt(nextCheckpoint())} kg</div><p class="center">${fmt(Math.max(0,w-nextCheckpoint()))} kg to go</p></div>
  <div class="grid3">
   <div class="card stat"><strong>${fmt(lost())}</strong><small>Total lost</small></div>
   <div class="card stat"><strong>${STEP}</strong><small>Step size</small></div>
   <div class="card stat"><strong>${checkpoints().filter(x=>x<w).length}</strong><small>Steps to go</small></div>
  </div>
  ${weightChart()}
  <div class="card soft quote">Individual numbers can go up and down. The trend is what matters.</div>
 </section>`;
}
function weightChart(){
 if(state.weights.length<2)return `<div class="card"><h2>Weight trend</h2><div class="chart-wrap"><div class="chart-empty">Your trend appears after two weigh-ins.<br>One number never tells the whole story.</div></div></div>`;
 const vals=state.weights.slice(-12), min=Math.min(...vals.map(x=>x.value),state.goal), max=Math.max(...vals.map(x=>x.value),state.start);
 const pts=vals.map((x,i)=>`${(i/(vals.length-1))*100},${100-((x.value-min)/(max-min||1))*90-5}`).join(" ");
 return `<div class="card"><h2>Weight trend</h2><div class="chart-wrap"><svg class="chart-line" viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="#25a876" stroke-width="2.5" vector-effect="non-scaling-stroke"/></svg></div></div>`;
}
function milestones(){
 const w=currentWeight();
 $("#view").innerHTML=`<section class="screen">
  <div class="header"><h1>Milestones</h1></div>
  <div class="segment"><button class="active">All Steps</button><button>Key Milestones</button></div>
  <div class="card timeline">${checkpoints().slice().reverse().map(x=>{
   const done=w<=x, cur=nextCheckpoint()===x, major=x%10===0||x===120, goal=x===state.goal;
   return `<div class="mile ${done?'done':''} ${cur?'current':''} ${major?'major':''} ${goal?'goal':''}">
    <strong>${fmt(x)} kg</strong><small>${x===START?'Starting point':x===state.goal?'Goal':done?`${fmt(START-x)} kg lost`:`${fmt(w-x)} kg to go`}</small>
   </div>`}).join("")}</div>
 </section>`;
}
function more(){
 $("#view").innerHTML=`<section class="screen">
  <div class="header"><h1>More</h1></div>
  <div class="card"><h2>My Goals</h2>
   <div class="row"><span>Starting weight</span><strong>${state.start.toFixed(1)} kg</strong></div>
   <div class="row"><span>Ultimate goal</span><strong>${state.goal.toFixed(1)} kg</strong></div>
   <div class="row"><span>Checkpoint size</span><strong>${STEP} kg</strong></div>
  </div>
  <div class="card"><h2>Progress Photos</h2>
   <p>Front • side • back, about every 4 weeks.</p>
   <button class="primary" id="addPhotos">Add Photos</button>
   <div id="photos">${renderPhotos()}</div>
  </div>
  <div class="card"><h2>Your data</h2><p>Everything stays on this device unless you export it.</p>
   <div class="backup-actions"><button class="secondary" id="export">Export Save</button><button class="secondary" id="importBtn">Import Save</button></div>
   <input type="file" id="importFile" accept="application/json" hidden>
  </div>
 </section>`;
 $("#addPhotos").onclick=()=>$("#photoInput").click();
 $("#export").onclick=exportSave;
 $("#importBtn").onclick=()=>$("#importFile").click();
 $("#importFile").onchange=importSave;
}
function renderPhotos(){
 if(!state.photos.length)return `<p style="color:var(--muted)">No progress photos added yet.</p>`;
 return state.photos.slice().reverse().map(p=>`<div class="photo-month"><strong>${p.date}</strong><div class="photo-grid">${p.images.map(src=>`<img src="${src}">`).join("")}</div></div>`).join("");
}
$("#photoInput").onchange=async e=>{
 const files=[...e.target.files].slice(0,3); if(!files.length)return;
 const images=await Promise.all(files.map(resizeImage));
 state.photos.push({date:dateStr(),images}); save(); more();
};
function resizeImage(file){
 return new Promise(resolve=>{
  const r=new FileReader(); r.onload=()=>{const img=new Image();img.onload=()=>{
   const c=document.createElement("canvas"), max=900, scale=Math.min(1,max/img.width);
   c.width=img.width*scale;c.height=img.height*scale;c.getContext("2d").drawImage(img,0,0,c.width,c.height);
   resolve(c.toDataURL("image/jpeg",.82));
  };img.src=r.result};r.readAsDataURL(file)
 });
}
function checkCelebration(v){
 const newly=checkpoints().filter(x=>v<=x && state.lastCelebrated>x);
 if(!newly.length)return;
 const hit=Math.min(...newly); state.lastCelebrated=hit; save();
 setTimeout(()=>celebrate(hit),80);
}
function celebrate(hit){
 const c=$("#celebration"); c.classList.remove("hidden");
 c.innerHTML=`<div class="celebration-box"><div class="confetti">◆ ✦ ● ✦ ◆</div><h1>Checkpoint Reached!</h1><div class="rock">🚩</div><div class="kg">${fmt(hit)} kg</div><h2>You've reached ${fmt(hit)} kg!</h2><p>${fmt(START-hit)} kg down • ${fmt(hit-GOAL)} kg to go</p><div class="card soft">Another step unlocked. Keep going.</div><button class="primary" onclick="document.getElementById('celebration').classList.add('hidden')">Continue</button></div>`;
}
function exportSave(){
 const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),a=document.createElement("a");
 a.href=URL.createObjectURL(blob);a.download=`mountain-journey-save-${dateStr()}.json`;a.click();URL.revokeObjectURL(a.href);
}
function importSave(e){
 const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{Object.assign(state,JSON.parse(r.result));save();more()}catch{alert("That save file could not be read.")}};r.readAsText(f)
}
home();
if("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js");
