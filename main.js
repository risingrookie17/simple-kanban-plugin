"use strict";var y=Object.defineProperty;var E=Object.getOwnPropertyDescriptor;var L=Object.getOwnPropertyNames;var M=Object.prototype.hasOwnProperty;var _=(i,n)=>{for(var e in n)y(i,e,{get:n[e],enumerable:!0})},D=(i,n,e,t)=>{if(n&&typeof n=="object"||typeof n=="function")for(let a of L(n))!M.call(i,a)&&a!==e&&y(i,a,{get:()=>n[a],enumerable:!(t=E(n,a))||t.enumerable});return i};var B=i=>D(y({},"__esModule",{value:!0}),i);var I={};_(I,{default:()=>w});module.exports=B(I);var k=require("obsidian");var u=require("obsidian");var j={todo:"\u5F85\u5904\u7406",doing:"\u8FDB\u884C\u4E2D",done:"\u5DF2\u5B8C\u6210"},F=["todo","doing","done"],T={\u5F00\u53D1:"\u{1F4BB} \u5F00\u53D1",\u8BBE\u8BA1:"\u{1F3A8} \u8BBE\u8BA1",\u6587\u6863:"\u{1F4DD} \u6587\u6863",\u6D4B\u8BD5:"\u{1F9EA} \u6D4B\u8BD5",\u8FD0\u7EF4:"\u2699\uFE0F \u8FD0\u7EF4",\u5176\u4ED6:"\u{1F4E6} \u5176\u4ED6"},v={high:{label:"\u9AD8",color:"#ef4444"},medium:{label:"\u4E2D",color:"#f59e0b"},low:{label:"\u4F4E",color:"#22c55e"}};var m=require("obsidian");function C(i){let n=i.split(`
`),e=-1;for(let a=0;a<Math.min(n.length,20);a++)if(n[a].trim()==="---"){e=a;break}if(e===-1)return null;let t=-1;for(let a=e+1;a<Math.min(n.length,50);a++)if(n[a].trim()==="---"){t=a;break}return t===-1?null:{start:e,end:t,contentStart:e+1,contentEnd:t}}function $(i){let n=C(i);if(!n)return{};let t=i.split(`
`).slice(n.contentStart,n.contentEnd),a={};for(let r of t){let s=r.trim();if(!s||s.startsWith("#"))continue;let o=s.indexOf(":");if(o===-1)continue;let p=s.substring(0,o).trim(),d=s.substring(o+1).trim();a[p]=d}return a}function S(i,n){let e=n||new Date().toISOString().split("T")[0],t=["---"];i.status&&(t.push(`  status: ${i.status}`),i.status==="doing"&&!i.start_date&&t.push(`  start_date: ${e}`),i.status==="done"&&!i.completed_date&&t.push(`  completed_date: ${e}`));let a=["status"];for(let[r,s]of Object.entries(i))a.includes(r)||s!=null&&s!==""&&t.push(`  ${r}: ${s}`);return t.push("---"),t.join(`
`)}function z(i){let n=i.split(`
`),e=0;for(let t of n)if(t.trim()==="---"&&(e++,e>2)||e===2&&t.trim()&&!t.trim().startsWith("---")&&/^\s*\w+:\s*/.test(t))return!0;return!1}function A(i){let n=i.split(`
`),e=[],t=!1,a=!1;for(let r of n){let s=r.trim();if(s==="---")if(a)if(t){t=!1;continue}else continue;else{t=!0,a=!0;continue}if(a&&!t&&s){if(/^\s*\w+:\s*/.test(r))continue;e.push(r);continue}t||e.push(r)}return e.join(`
`)}function K(i,n,e){let t=C(i);if(!t)return`${S({status:n},e)}

${i}`;let a=$(i);a.status=n;let r=S(a,e),s=i.split(`
`);if(z(i)){let d=A(i).split(`
`),l=0;for(let c=0;c<d.length;c++)if(d[c].trim()&&!d[c].trim().startsWith("---")){l=c;break}return[r,"",...d.slice(l)].join(`
`)}return[...s.slice(0,t.start),r,...s.slice(t.end+1)].join(`
`)}var g=class{constructor(n){this.projectsPath="Projects";this.app=n}async createProject(n){let e=n.startsWith("P-")?n:`P-${n}`,t=`${this.projectsPath}/${e}`,a=`${t}/\u4EFB\u52A1`;try{return this.app.vault.getAbstractFileByPath(t)?(console.log("Project already exists:",t),null):(await this.app.vault.createFolder(t),this.app.vault.getAbstractFileByPath(a)||await this.app.vault.createFolder(a),{id:e,name:n.replace("P-",""),path:t,taskFolder:a})}catch(r){return console.error("Failed to create project:",r),null}}async scanProjects(){let n=[],e=this.app.vault.getAbstractFileByPath(this.projectsPath);if(!e||!(e instanceof m.TFolder))return n;for(let t of e.children)if(t instanceof m.TFolder&&t.name.startsWith("P-")){let a=this.app.vault.getAbstractFileByPath(`${t.path}/\u4EFB\u52A1`);if(!a||!(a instanceof m.TFolder))try{await this.app.vault.createFolder(`${t.path}/\u4EFB\u52A1`),a=this.app.vault.getAbstractFileByPath(`${t.path}/\u4EFB\u52A1`)}catch(r){console.warn("Could not create task folder:",r)}a&&a instanceof m.TFolder&&n.push({id:t.name,name:t.name.replace("P-",""),path:t.path,taskFolder:a.path})}return n}async scanTasks(n){let e=(await this.scanProjects()).find(r=>r.id===n);if(!e)return[];let t=[],a=this.app.vault.getAbstractFileByPath(e.taskFolder);if(!a||!(a instanceof m.TFolder))return t;for(let r of a.children)if(r instanceof m.TFile&&r.name.startsWith("T-")&&r.extension==="md"){let s=await this.loadTaskFromFile(r);if(s){let o=s.frontmatter?.project||"";(o===n||!o)&&t.push(s)}}return t}async loadTaskFromFile(n){try{let e=await this.app.vault.read(n),t=this.app.metadataCache.getFileCache(n),a={status:"todo",project:"",task_type:"\u5176\u4ED6",priority:"medium"};if(t?.frontmatter){let o=t.frontmatter;a={status:o.status||"todo",project:o.project||"",task_type:o.task_type||"\u5176\u4ED6",priority:o.priority||"medium",assignee:o.assignee,start_date:o.start_date,due_date:o.due_date,completed_date:o.completed_date,estimated_hours:o.estimated_hours,tags:o.tags||[]}}let r=n.name.replace(".md",""),s=e.split(`
`);for(let o of s)if(o.startsWith("# ")){r=o.replace("# ","").trim();break}return{id:n.path,filePath:n.path,fileName:n.name.replace(".md",""),title:r,content:e,frontmatter:a,ctime:n.stat.ctime,mtime:n.stat.mtime}}catch(e){return console.error(`Failed to load task from ${n.path}:`,e),null}}async buildKanbanBoard(n){let e=F.map((a,r)=>({id:a,name:j[a],order:r,tasks:[]})),t=await this.scanTasks(n);for(let a of t){let r=a.frontmatter.status||"todo",s=e.find(o=>o.id===r);s?s.tasks.push(a):e[0].tasks.push(a)}return{projects:await this.scanProjects(),selectedProject:n,columns:e,lastScanTime:Date.now()}}async getAllProjectsWithStats(){let n=await this.scanProjects(),e=[];for(let t of n){let a=await this.scanTasks(t.id);e.push({id:t.id,name:t.name,taskCount:a.length})}return e}async updateTaskStatus(n,e){let t=this.app.vault.getAbstractFileByPath(n.filePath);if(!t||!(t instanceof m.TFile)){console.error("Task file not found:",n.filePath);return}try{let a=await this.app.vault.read(t),r=new Date().toISOString().split("T")[0],s=K(a,e,r);await this.app.vault.modify(t,s),n.frontmatter.status=e,n.mtime=t.stat.mtime}catch(a){console.error("Failed to update task status:",a)}}async createTask(n,e,t="\u5176\u4ED6",a="medium"){let r=(await this.scanProjects()).find(l=>l.id===n);if(!r)return console.error("Project not found:",n),null;let s=`T-${e}.md`,o=`${r.taskFolder}/${s}`;if(this.app.vault.getAbstractFileByPath(o))return console.error("Task file already exists:",o),null;let d=`---
status: todo
project: ${n}
task_type: ${t}
priority: ${a}
---

# ${e}

## \u4EFB\u52A1\u63CF\u8FF0

>

## \u9A8C\u6536\u6807\u51C6

- [ ]

## \u5907\u6CE8

`;try{await this.app.vault.create(o,d);let l=this.app.vault.getAbstractFileByPath(o);if(l&&l instanceof m.TFile)return await this.loadTaskFromFile(l)}catch(l){console.error("Failed to create task:",l)}return null}async deleteTask(n){let e=this.app.vault.getAbstractFileByPath(n.filePath);if(!e||!(e instanceof m.TFile))return!1;try{return await this.app.vault.delete(e),!0}catch(t){return console.error("Failed to delete task:",t),!1}}};var f=class extends u.View{constructor(e,t){super(e);this.board=null;this.draggedTask=null;this.storage=new g(t.app)}getViewType(){return"simple-kanban-view"}getDisplayText(){return"Simple Kanban"}async onOpen(){await this.loadBoard(),this.render(),this.registerFileWatcher()}async onClose(){}async loadBoard(){let e=await this.storage.scanProjects();if(e.length===0){this.board={projects:[],selectedProject:"",columns:[],lastScanTime:Date.now()};return}let t=e[0].id;this.board=await this.storage.buildKanbanBoard(t)}async switchProject(e){this.board&&(this.board=await this.storage.buildKanbanBoard(e),this.render())}registerFileWatcher(){this.app.vault.on("modify",async e=>{e instanceof u.TFile&&e.name.startsWith("T-")&&await this.refresh()}),this.app.vault.on("create",async e=>{e instanceof u.TFile&&e.name.startsWith("T-")&&await this.refresh()}),this.app.vault.on("delete",async e=>{e instanceof u.TFile&&e.name.startsWith("T-")&&await this.refresh()})}async refresh(){if(console.log("Refreshing kanban board..."),!this.board){console.log("No board to refresh");return}console.log("Current project:",this.board.selectedProject),this.board=await this.storage.buildKanbanBoard(this.board.selectedProject),console.log("Board tasks:",this.board.columns.map(e=>`${e.name}: ${e.tasks.length}`)),this.render(),console.log("Render complete")}render(){if(!this.board)return;let e=this.containerEl;if(e.empty(),e.addClass("simple-kanban"),this.renderHeader(e),this.board.projects.length===0){this.renderEmptyState(e);return}this.renderColumns(e)}renderHeader(e){let t=e.createDiv("simple-kanban-header"),a=t.createDiv("simple-kanban-header-controls"),r=a.createDiv("simple-kanban-project-wrapper"),s=r.createEl("select");s.className="simple-kanban-project-select";let o=r.createSpan("simple-kanban-project-arrow");o.innerHTML=`<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>`;for(let c of this.board.projects){let b=s.createEl("option");b.value=c.id,b.textContent=c.name,c.id===this.board.selectedProject&&(b.selected=!0)}s.addEventListener("change",()=>{this.switchProject(s.value)});let p=a.createEl("button");p.className="simple-kanban-add-btn",p.textContent="+ \u65B0\u5EFA\u9879\u76EE",p.addEventListener("click",()=>this.showCreateProjectModal());let d=a.createEl("button");d.className="simple-kanban-add-btn",d.textContent="+ \u65B0\u5EFA\u4EFB\u52A1",d.addEventListener("click",()=>this.showCreateTaskModal());let l=a.createEl("button");l.className="simple-kanban-refresh-btn",l.title="\u5237\u65B0",l.innerHTML=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
    </svg>`,l.addEventListener("click",async()=>{console.log("Refreshing kanban..."),await this.refresh(),console.log("Kanban refreshed")});let x=t.createDiv("simple-kanban-header-title")}renderEmptyState(e){let t=e.createDiv("simple-kanban-empty"),a=t.createDiv("simple-kanban-empty-icon");a.textContent="\u{1F4C1}",t.createDiv().textContent="\u6CA1\u6709\u627E\u5230\u9879\u76EE";let r=t.createDiv();r.textContent="\u8BF7\u5728 Projects/ \u76EE\u5F55\u4E0B\u521B\u5EFA P- \u5F00\u5934\u7684\u9879\u76EE\u6587\u4EF6\u5939",r.style.cssText="color: var(--sk-text-muted); font-size: 14px; margin-top: 8px;"}renderColumns(e){let t=e.createDiv("simple-kanban-board");for(let a of this.board.columns)this.renderColumn(t,a)}renderColumn(e,t){let a=e.createDiv("simple-kanban-column"),r=a.createDiv("simple-kanban-column-header"),s=r.createEl("h3");s.textContent=t.name;let o=r.createSpan("simple-kanban-task-count");o.textContent=`(${t.tasks.length})`;let p=a.createDiv("simple-kanban-task-list");for(let d of t.tasks)this.renderTask(p,d,t.id);this.setupColumnDropZone(a,t.id)}renderTask(e,t,a){let r=e.createDiv("simple-kanban-card");r.setAttribute("draggable","true"),r.setAttribute("data-task-id",t.id),r.setAttribute("data-column-id",a);let s=r.createDiv("simple-kanban-card-title");s.textContent=t.title;let o=r.createDiv("simple-kanban-card-meta"),p=o.createSpan("simple-kanban-card-type");p.textContent=T[t.frontmatter.task_type]||t.frontmatter.task_type;let d=v[t.frontmatter.priority]||v.medium,l=o.createSpan("simple-kanban-card-priority");if(l.textContent=d.label,l.style.backgroundColor=d.color+"20",l.style.color=d.color,t.frontmatter.due_date){let h=o.createSpan("simple-kanban-card-due");h.textContent="\u{1F4C5} "+t.frontmatter.due_date}let x=r.createDiv("simple-kanban-card-actions"),c=x.createEl("button");c.className="simple-kanban-card-edit",c.textContent="\u270E",c.title="\u7F16\u8F91",c.addEventListener("click",h=>{h.stopPropagation(),this.openTaskFile(t.filePath)});let b=x.createEl("button");b.className="simple-kanban-card-delete",b.textContent="\xD7",b.title="\u5220\u9664",b.addEventListener("click",h=>{h.stopPropagation(),this.deleteTask(t)}),r.addEventListener("click",()=>{this.openTaskFile(t.filePath)}),this.setupTaskDrag(r,t,a)}async openTaskFile(e){let t=this.app.vault.getAbstractFileByPath(e);t&&t instanceof u.TFile&&await this.app.workspace.getLeaf(!1).openFile(t)}setupTaskDrag(e,t,a){e.addEventListener("dragstart",r=>{console.log("[Kanban] Drag start:",t.title,"from column:",a),this.draggedTask={task:t,columnId:a},e.addClass("simple-kanban-card-dragging"),r.dataTransfer?.setData("text/plain",t.id),r.dataTransfer.effectAllowed="move"}),e.addEventListener("dragend",()=>{console.log("[Kanban] Drag end"),e.removeClass("simple-kanban-card-dragging"),setTimeout(()=>{this.draggedTask&&(console.log("[Kanban] Drag ended without drop, clearing draggedTask"),this.draggedTask=null)},500)})}setupColumnDropZone(e,t){e.addEventListener("dragover",a=>{a.preventDefault(),a.dataTransfer.dropEffect="move",e.addClass("simple-kanban-column-drag-over")}),e.addEventListener("dragleave",()=>{e.removeClass("simple-kanban-column-drag-over")}),e.addEventListener("drop",a=>{a.preventDefault(),e.removeClass("simple-kanban-column-drag-over");let r=this.draggedTask?`${this.draggedTask.task.title} from ${this.draggedTask.columnId}`:"null";if(console.log("[Kanban] Drop event on column:",t,"| draggedTask:",r),this.draggedTask){let s=this.draggedTask.columnId,o=t;console.log("[Kanban] Move task:",this.draggedTask.task.title,"from",s,"to",o),s!==o?this.moveTask(this.draggedTask.task,s,o):(console.log("[Kanban] Same column reorder - refreshing"),this.refresh()),this.draggedTask=null}else console.log("[Kanban] No draggedTask found!")})}async moveTask(e,t,a){console.log("[Kanban] moveTask called:",e.title,"to",a),await this.storage.updateTaskStatus(e,a),console.log("[Kanban] Task status updated, file watcher will trigger refresh")}async deleteTask(e){confirm(`\u786E\u5B9A\u8981\u5220\u9664\u4EFB\u52A1 "${e.title}" \u5417\uFF1F`)&&(await this.storage.deleteTask(e),await this.refresh())}showCreateProjectModal(){this.createModal("\u65B0\u5EFA\u9879\u76EE",`
      <div class="simple-kanban-modal-field">
        <label>\u9879\u76EE\u540D\u79F0</label>
        <input type="text" id="project-name" placeholder="\u8F93\u5165\u9879\u76EE\u540D\u79F0\uFF08\u65E0\u9700\u52A0 P- \u524D\u7F00\uFF09" autofocus>
        <p class="simple-kanban-modal-hint">\u5C06\u81EA\u52A8\u5728 Projects \u6587\u4EF6\u5939\u4E0B\u521B\u5EFA P-\u9879\u76EE\u540D\u79F0/\u4EFB\u52A1/ \u7ED3\u6784</p>
      </div>
    `,async()=>{let t=document.getElementById("project-name").value.trim();if(!t)return;let a=await this.storage.createProject(t);a&&(await this.refresh(),this.board.selectedProject=a.id,this.board.projects=await this.storage.scanProjects(),this.render())}).open()}showCreateTaskModal(){if(!this.board||!this.board.selectedProject)return;let e=["\u5F00\u53D1","\u8BBE\u8BA1","\u6587\u6863","\u6D4B\u8BD5","\u8FD0\u7EF4","\u5176\u4ED6"],t=["high","medium","low"];this.createModal("\u65B0\u5EFA\u4EFB\u52A1",`
      <div class="simple-kanban-modal-field">
        <label>\u4EFB\u52A1\u6807\u9898</label>
        <input type="text" id="task-title" placeholder="\u8F93\u5165\u4EFB\u52A1\u6807\u9898" autofocus>
      </div>
      <div class="simple-kanban-modal-field">
        <label>\u4EFB\u52A1\u7C7B\u578B</label>
        <select id="task-type">
          ${e.map(r=>`<option value="${r}">${T[r]}</option>`).join("")}
        </select>
      </div>
      <div class="simple-kanban-modal-field">
        <label>\u4F18\u5148\u7EA7</label>
        <select id="task-priority">
          ${t.map(r=>`<option value="${r}" ${r==="medium"?"selected":""}>${v[r].label}</option>`).join("")}
        </select>
      </div>
    `,async()=>{let r=document.getElementById("task-title").value.trim(),s=document.getElementById("task-type").value,o=document.getElementById("task-priority").value;r&&(await this.storage.createTask(this.board.selectedProject,r,s,o),await this.refresh())}).open()}createModal(e,t,a){let r=document.createElement("div");r.className="simple-kanban-modal",r.innerHTML=`
      <div class="simple-kanban-modal-backdrop"></div>
      <div class="simple-kanban-modal-content">
        <div class="simple-kanban-modal-header">
          <h3>${e}</h3>
          <button class="simple-kanban-modal-close">&times;</button>
        </div>
        <div class="simple-kanban-modal-body">
          ${t}
        </div>
        <div class="simple-kanban-modal-footer">
          <button class="simple-kanban-modal-cancel">\u53D6\u6D88</button>
          <button class="simple-kanban-modal-save">\u521B\u5EFA</button>
        </div>
      </div>
    `,document.body.appendChild(r);let s=()=>{document.body.removeChild(r)};return r.querySelector(".simple-kanban-modal-backdrop")?.addEventListener("click",s),r.querySelector(".simple-kanban-modal-close")?.addEventListener("click",s),r.querySelector(".simple-kanban-modal-close")?.addEventListener("click",s),r.querySelector(".simple-kanban-modal-save")?.addEventListener("click",async()=>{await a(),s()}),{open:()=>{r.querySelector("#task-title")?.focus()}}}};var w=class extends k.Plugin{async onload(){console.log("Loading Simple Kanban plugin"),this.loadStyles(),this.registerView("simple-kanban-view",n=>new f(n,this)),this.addCommand({id:"open-kanban",name:"\u6253\u5F00\u770B\u677F",callback:()=>this.openKanban()}),this.addCommand({id:"new-kanban-project",name:"\u65B0\u5EFA\u770B\u677F\u9879\u76EE",callback:()=>this.createNewProject()}),this.addRibbonIcon("layout","\u6253\u5F00\u770B\u677F",()=>{this.openKanban()}),this.registerEvent(this.app.workspace.on("context-menu",(n,e)=>{if(e instanceof k.TFolder){let t=e.path;(t==="Projects"||t.startsWith("Projects/"))&&n.addItem(a=>{a.setTitle("\u65B0\u5EFA\u770B\u677F\u9879\u76EE").setIcon("plus").onClick(()=>{this.createNewProject(e.path==="Projects"?"":e.name)})})}})),this.addSettingTab(new P(this))}async createNewProject(n=""){let e=new g(this.app),t=n?n.replace("P-",""):"";this.openKanban(),setTimeout(()=>{let a=this.app.workspace.getActiveViewOfType(f);a&&(n&&n!=="Projects"?e.createProject(n.replace("P-","")).then(async()=>{await a.refresh()}):a.showCreateProjectModal())},100)}loadStyles(){this.app.workspace.onLayoutReady(()=>{let n="simple-kanban-styles-v2";if(!document.getElementById(n)){let e=document.createElement("style");e.id=n,e.textContent=`
/* ===== Simple Kanban V2 - \u73B0\u4EE3\u7B80\u6D01\u8BBE\u8BA1 ===== */
:root {
  --sk-accent: #6366f1;
  --sk-accent-hover: #4f46e5;
  --sk-bg: #fafbfc;
  --sk-card-bg: #ffffff;
  --sk-column-bg: #f1f5f9;
  --sk-border: #e2e8f0;
  --sk-text: #1e293b;
  --sk-text-muted: #64748b;
  --sk-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06);
  --sk-shadow-hover: 0 10px 25px rgba(99, 102, 241, 0.15), 0 4px 10px rgba(0,0,0,0.08);
  --sk-radius: 12px;
  --sk-radius-sm: 8px;
}

/* \u770B\u677F\u5BB9\u5668 */
.simple-kanban {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--sk-bg);
  padding: 0;
}

/* \u5934\u90E8 */
.simple-kanban-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: var(--sk-card-bg);
  border-bottom: 1px solid var(--sk-border);
  flex-shrink: 0;
  gap: 12px;
}

/* \u5934\u90E8\u63A7\u4EF6\u5BB9\u5668 - \u5305\u542B\u9879\u76EE\u9009\u62E9\u548C\u6309\u94AE */
.simple-kanban-header-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* \u5934\u90E8\u6807\u9898 */
.simple-kanban-header-title {
  display: flex;
  align-items: center;
}

.simple-kanban-header h2,
.simple-kanban-header-title h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--sk-text);
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

@media (max-width: 600px) {
  .simple-kanban-header {
    padding: 12px 16px;
    flex-wrap: wrap;
    gap: 10px;
  }
  .simple-kanban-header h2 {
    font-size: 16px;
  }
}

/* \u770B\u677F\u533A\u57DF */
.simple-kanban-board {
  flex: 1;
  display: flex;
  gap: 12px;
  padding: 16px;
  overflow-x: auto;
  align-items: flex-start;
}

/* \u5217 - \u54CD\u5E94\u5F0F */
.simple-kanban-column {
  flex: 0 0 auto;
  width: 260px;
  min-width: 200px;
  max-width: 320px;
  height: calc(100vh - 120px);
  background: var(--sk-column-bg);
  border-radius: var(--sk-radius);
  display: flex;
  flex-direction: column;
  border: 1px solid var(--sk-border);
  transition: all 0.2s ease;
}

/* \u5C0F\u5C4F\u5E55 */
@media (max-width: 768px) {
  .simple-kanban-column {
    flex: 0 0 auto;
    width: 200px;
    min-width: 160px;
    max-width: 240px;
    height: calc(100vh - 100px);
  }
  .simple-kanban-board {
    gap: 8px;
    padding: 12px;
  }
}

/* \u5927\u5C4F\u5E55 */
@media (min-width: 1400px) {
  .simple-kanban-column {
    flex: 0 0 auto;
    width: 300px;
    max-width: 360px;
    height: calc(100vh - 120px);
  }
}

.simple-kanban-column-drag-over {
  background: #e0e7ff;
  border-color: var(--sk-accent);
  transform: scale(1.02);
}

/* \u5217\u5934\u90E8 */
.simple-kanban-column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 18px;
  border-bottom: 1px solid var(--sk-border);
  background: var(--sk-card-bg);
  border-radius: var(--sk-radius) var(--sk-radius) 0 0;
}

.simple-kanban-column-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--sk-text);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.simple-kanban-task-count {
  background: var(--sk-accent);
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;
  margin-left: 8px;
}

.simple-kanban-column-add {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--sk-accent);
  cursor: pointer;
  border-radius: var(--sk-radius-sm);
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-weight: 300;
}

.simple-kanban-column-add:hover {
  background: var(--sk-accent);
  color: white;
  transform: scale(1.1);
}

/* \u4EFB\u52A1\u5217\u8868 */
.simple-kanban-task-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  min-height: 80px;
}

/* \u6EDA\u52A8\u6761 */
.simple-kanban-task-list::-webkit-scrollbar {
  width: 6px;
}

.simple-kanban-task-list::-webkit-scrollbar-track {
  background: transparent;
}

.simple-kanban-task-list::-webkit-scrollbar-thumb {
  background: var(--sk-border);
  border-radius: 3px;
}

.simple-kanban-task-list::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}

/* \u4EFB\u52A1\u5361\u7247 */
.simple-kanban-card {
  background: var(--sk-card-bg);
  border: 1px solid var(--sk-border);
  border-radius: var(--sk-radius-sm);
  padding: 14px;
  margin-bottom: 10px;
  cursor: grab;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.simple-kanban-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(180deg, #6366f1 0%, #8b5cf6 100%);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.simple-kanban-card:hover {
  box-shadow: var(--sk-shadow-hover);
  transform: translateY(-2px);
  border-color: var(--sk-accent);
}

.simple-kanban-card:hover::before {
  opacity: 1;
}

.simple-kanban-card-dragging {
  opacity: 0.6;
  transform: rotate(3deg) scale(1.02);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

/* \u4EFB\u52A1\u6807\u9898 */
.simple-kanban-card-title {
  font-weight: 600;
  margin-bottom: 8px;
  word-break: break-word;
  color: var(--sk-text);
  font-size: 14px;
  line-height: 1.4;
}

/* \u4EFB\u52A1\u5185\u5BB9\u9884\u89C8 */
.simple-kanban-card-content {
  font-size: 12px;
  color: var(--sk-text-muted);
  margin-bottom: 10px;
  word-break: break-word;
  line-height: 1.5;
}

/* \u6807\u7B7E */
.simple-kanban-card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.simple-kanban-tag {
  font-size: 11px;
  padding: 4px 10px;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  color: var(--sk-text-muted);
  border-radius: 20px;
  font-weight: 500;
  border: 1px solid var(--sk-border);
}

/* \u5361\u7247\u64CD\u4F5C\u6309\u94AE */
.simple-kanban-card-actions {
  display: flex;
  gap: 6px;
  opacity: 0;
  transition: opacity 0.2s ease;
  position: absolute;
  top: 10px;
  right: 10px;
}

.simple-kanban-card:hover .simple-kanban-card-actions {
  opacity: 1;
}

.simple-kanban-card-edit,
.simple-kanban-card-delete {
  width: 26px;
  height: 26px;
  border: none;
  background: var(--sk-column-bg);
  color: var(--sk-text-muted);
  cursor: pointer;
  border-radius: 6px;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.simple-kanban-card-edit:hover {
  background: var(--sk-accent);
  color: white;
  transform: scale(1.1);
}

.simple-kanban-card-delete:hover {
  background: #fee2e2;
  color: #ef4444;
  transform: scale(1.1);
}

/* \u5F39\u7A97 */
.simple-kanban-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.simple-kanban-modal-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
}

.simple-kanban-modal-content {
  position: relative;
  background: var(--sk-card-bg);
  border-radius: 16px;
  width: 440px;
  max-width: 90vw;
  max-height: 85vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.simple-kanban-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--sk-border);
  background: linear-gradient(135deg, #fafbfc 0%, #f1f5f9 100%);
}

.simple-kanban-modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--sk-text);
}

.simple-kanban-modal-close {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 24px;
  color: var(--sk-text-muted);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.simple-kanban-modal-close:hover {
  background: var(--sk-column-bg);
  color: var(--sk-text);
  transform: rotate(90deg);
}

.simple-kanban-modal-body {
  padding: 24px;
  overflow-y: auto;
}

.simple-kanban-modal-field {
  margin-bottom: 20px;
}

.simple-kanban-modal-field label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--sk-text);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.simple-kanban-modal-hint {
  margin-top: 8px;
  font-size: 12px;
  color: var(--sk-text-muted);
}

.simple-kanban-modal-field input,
.simple-kanban-modal-field textarea,
.simple-kanban-modal-field select {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid var(--sk-border);
  border-radius: var(--sk-radius-sm);
  background: var(--sk-card-bg);
  color: var(--sk-text);
  font-size: 14px;
  box-sizing: border-box;
  transition: all 0.2s ease;
  font-family: inherit;
}

.simple-kanban-modal-field input:focus,
.simple-kanban-modal-field textarea:focus,
.simple-kanban-modal-field select:focus {
  outline: none;
  border-color: var(--sk-accent);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.simple-kanban-modal-field textarea {
  min-height: 100px;
  resize: vertical;
}

.simple-kanban-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid var(--sk-border);
  background: var(--sk-column-bg);
}

.simple-kanban-modal-cancel,
.simple-kanban-modal-save {
  padding: 12px 24px;
  border-radius: var(--sk-radius-sm);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.simple-kanban-modal-cancel {
  background: transparent;
  border: 2px solid var(--sk-border);
  color: var(--sk-text-muted);
}

.simple-kanban-modal-cancel:hover {
  background: var(--sk-card-bg);
  border-color: var(--sk-text-muted);
  color: var(--sk-text);
}

.simple-kanban-modal-save {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border: none;
  color: white;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
}

.simple-kanban-modal-save:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

/* \u7A7A\u72B6\u6001 */
.simple-kanban-empty {
  text-align: center;
  padding: 40px 20px;
  color: var(--sk-text-muted);
}

.simple-kanban-empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

/* \u5173\u8054\u6587\u4EF6\u6837\u5F0F */
.simple-kanban-card-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 6px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid #bae6fd;
}

.simple-kanban-card-link:hover {
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(14, 165, 233, 0.2);
}

.simple-kanban-card-link-icon {
  font-size: 14px;
}

.simple-kanban-card-link-name {
  font-size: 12px;
  color: #0369a1;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* \u6587\u4EF6\u9009\u62E9\u5668 */
.simple-kanban-file-item {
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid var(--sk-border);
  transition: background 0.15s ease;
  font-size: 14px;
}

.simple-kanban-file-item:hover {
  background: var(--sk-column-bg);
}

.simple-kanban-file-item:last-child {
  border-bottom: none;
}

.simple-kanban-file-more {
  padding: 12px 16px;
  text-align: center;
  color: var(--sk-text-muted);
  font-size: 12px;
}

/* \u9879\u76EE\u9009\u62E9\u5668\u5305\u88C5\u5668 */
.simple-kanban-project-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.simple-kanban-project-select {
  padding: 10px 36px 10px 14px;
  border: 1px solid var(--sk-border);
  border-radius: var(--sk-radius-sm);
  background: var(--sk-card-bg);
  color: var(--sk-text);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  min-width: 140px;
  height: 40px;
  line-height: 20px;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.simple-kanban-project-select:hover {
  border-color: var(--sk-accent);
  box-shadow: 0 2px 4px rgba(99, 102, 241, 0.1);
}

.simple-kanban-project-select option {
  padding: 10px 14px;
  background: var(--sk-card-bg);
  color: var(--sk-text);
  font-size: 14px;
}

.simple-kanban-project-select:focus {
  outline: none;
  border-color: var(--sk-accent);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

/* \u81EA\u5B9A\u4E49\u4E0B\u62C9\u7BAD\u5934 */
.simple-kanban-project-arrow {
  position: absolute;
  right: 12px;
  pointer-events: none;
  color: var(--sk-text-muted);
  transition: transform 0.2s ease;
}

.simple-kanban-project-wrapper:focus-within .simple-kanban-project-arrow {
  color: var(--sk-accent);
}

/* \u7EDF\u4E00\u6309\u94AE\u57FA\u7840\u6837\u5F0F */
.simple-kanban-project-select,
.simple-kanban-add-btn,
.simple-kanban-refresh-btn {
  height: 40px;
  border-radius: var(--sk-radius-sm);
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  cursor: pointer;
}

/* \u9879\u76EE\u9009\u62E9\u5668 */
.simple-kanban-project-select {
  padding: 10px 36px 10px 14px;
  border: 1px solid var(--sk-border);
  background: var(--sk-card-bg);
  color: var(--sk-text);
  min-width: 140px;
  line-height: 20px;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.simple-kanban-project-select:hover,
.simple-kanban-project-select:focus {
  border-color: var(--sk-accent);
  outline: none;
  box-shadow: 0 2px 4px rgba(99, 102, 241, 0.15);
}

/* \u65B0\u5EFA\u4EFB\u52A1\u6309\u94AE */
.simple-kanban-add-btn {
  padding: 0 20px;
  background: var(--sk-card-bg);
  color: var(--sk-text);
  border: 1px solid var(--sk-border);
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.simple-kanban-add-btn:hover {
  background: var(--sk-accent);
  color: white;
  border-color: var(--sk-accent);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
}

/* \u5237\u65B0\u6309\u94AE */
.simple-kanban-refresh-btn {
  width: 40px;
  padding: 0;
  border: 1px solid var(--sk-border);
  background: var(--sk-card-bg);
  color: var(--sk-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.simple-kanban-refresh-btn svg {
  width: 18px;
  height: 18px;
  transition: transform 0.3s ease;
}

.simple-kanban-refresh-btn:hover {
  background: var(--sk-accent);
  color: white;
  border-color: var(--sk-accent);
}

.simple-kanban-refresh-btn:hover svg {
  transform: rotate(180deg);
}

.simple-kanban-refresh-btn:active svg {
  transform: rotate(180deg) scale(0.9);
}

/* \u4EFB\u52A1\u5143\u4FE1\u606F\u884C */
.simple-kanban-card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  flex-wrap: wrap;
}

/* \u4EFB\u52A1\u7C7B\u578B\u6807\u7B7E */
.simple-kanban-card-type {
  font-size: 11px;
  padding: 2px 8px;
  background: var(--sk-column-bg);
  color: var(--sk-text-muted);
  border-radius: 4px;
}

/* \u4F18\u5148\u7EA7\u6807\u7B7E */
.simple-kanban-card-priority {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: 500;
}

/* \u622A\u6B62\u65E5\u671F */
.simple-kanban-card-due {
  font-size: 11px;
  color: var(--sk-text-muted);
  margin-left: auto;
}
`,document.head.appendChild(e)}})}async onunload(){console.log("Unloading Simple Kanban plugin")}async openKanban(){let n=this.app.workspace.getLeavesOfType("simple-kanban-view")[0];n?this.app.workspace.revealLeaf(n):await this.app.workspace.getLeaf(!1).setViewState({type:"simple-kanban-view"})}},P=class{constructor(n){this.plugin=n}display(){let{containerEl:n}=this.plugin;n.empty();let e=n.createEl("h2");e.textContent="Simple Kanban",e.style.cssText="font-size: 24px; font-weight: 700; margin-bottom: 24px; background: linear-gradient(135deg, #6366f1, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent;",new k.Setting(n).setName("\u5173\u4E8E").setDesc("\u6781\u7B80\u770B\u677F\u63D2\u4EF6 - \u4E3A Obsidian \u6253\u9020\u7684\u4F18\u96C5\u770B\u677F\u5DE5\u5177"),new k.Setting(n).setName("\u4F7F\u7528\u65B9\u6CD5").setDesc("\u70B9\u51FB\u5DE6\u4FA7\u680F\u7684\u770B\u677F\u56FE\u6807\u6216\u4F7F\u7528\u547D\u4EE4\u9762\u677F\u6253\u5F00\u770B\u677F"),new k.Setting(n).setName("\u5FEB\u6377\u952E").setDesc('\u4F7F\u7528 Ctrl+P \u6253\u5F00\u547D\u4EE4\u9762\u677F\uFF0C\u8F93\u5165"\u770B\u677F"\u5FEB\u901F\u6253\u5F00')}};
