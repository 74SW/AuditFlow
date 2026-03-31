// ============================================================
// AUDITFLOW — VUES
// Toutes les pages de l'application
// ============================================================

const VIEWS = {};
const VIEWS_INIT = {};

// ============================================================
// TABLEAU DE BORD
// ============================================================

VIEWS['dashboard'] = () => {
  const procActive = STATE.audits.filter(a => a.type==='Process' && a.status!=='Clôturé' && a.status!=='Planifié').slice(0,4);
  const buActive   = STATE.audits.filter(a => a.type==='BU'      && a.status!=='Clôturé' && a.status!=='Planifié').slice(0,4);
  const lateActions = STATE.actions.filter(a => a.status==='En retard').slice(0,3);
  const covPct = Math.round(STATE.processes.filter(p => ['y25','y26','y27','y28'].some(y=>p[y])).length / STATE.processes.length * 100);

  return `
  <div class="topbar">
    <div class="topbar-title">Tableau de bord — 2025</div>
    <button class="btn-primary" onclick="navigate('mes-audits')">+ Nouvel audit</button>
  </div>
  <div class="content">
    <div class="metrics">
      <div class="card metric-card"><div class="metric-label">Process Audits 2025</div><div class="metric-value">${STATE.audits.filter(a=>a.type==='Process').length}</div><div class="metric-sub">Plan process</div></div>
      <div class="card metric-card"><div class="metric-label">BU Audits 2025</div><div class="metric-value">${STATE.audits.filter(a=>a.type==='BU').length}</div><div class="metric-sub">Plan BU</div></div>
      <div class="card metric-card"><div class="metric-label">Plans d'action ouverts</div><div class="metric-value" style="color:#854F0B">${STATE.actions.filter(a=>a.status!=='Clôturé').length}</div><div class="metric-sub">${STATE.actions.filter(a=>a.status==='En retard').length} en retard</div></div>
      <div class="card metric-card"><div class="metric-label">Couverture process</div><div class="metric-value" style="color:#3B6D11">${covPct}%</div><div class="metric-sub">${STATE.processes.filter(p=>['y25','y26','y27','y28'].some(y=>p[y])).length} / ${STATE.processes.length} process</div></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem">
      <div>
        <div class="section-header"><div class="section-title">Process Audits en cours</div><button class="btn-secondary" style="font-size:11px" onclick="navigate('mes-audits')">Voir tout</button></div>
        <div class="audit-list">${procActive.map(a=>`<div class="audit-row" onclick="openAudit('${a.id}')"><div style="flex:1"><div class="audit-name">${a.name}</div><div class="audit-meta">${a.ent} · ${a.resp}</div></div>${badge(a.status)}${pbar(a.status)}</div>`).join('') || '<div style="font-size:12px;color:var(--text-3);padding:.5rem 0">Aucun audit en cours</div>'}</div>
      </div>
      <div>
        <div class="section-header"><div class="section-title">BU Audits en cours</div><button class="btn-secondary" style="font-size:11px" onclick="navigate('mes-audits')">Voir tout</button></div>
        <div class="audit-list">${buActive.map(a=>`<div class="audit-row" onclick="openAudit('${a.id}')"><div style="flex:1"><div class="audit-name">${a.name}</div><div class="audit-meta">${a.ent} · ${a.resp}</div></div>${badge(a.status)}${pbar(a.status)}</div>`).join('') || '<div style="font-size:12px;color:var(--text-3);padding:.5rem 0">Aucun audit en cours</div>'}</div>
      </div>
    </div>
    <div class="section-header"><div class="section-title">Plans d'action urgents</div><button class="btn-secondary" style="font-size:11px" onclick="navigate('plans-action')">Voir tout</button></div>
    <div class="audit-list">${lateActions.map(a=>`<div class="audit-row"><div style="flex:1"><div class="audit-name">${a.title}</div><div class="audit-meta">${a.audit} · ${a.resp} · Éch. ${a.due}</div></div>${badge(a.status)}</div>`).join('') || '<div style="font-size:12px;color:var(--text-3);padding:.5rem 0">Aucune action en retard</div>'}</div>
  </div>`;
};

// ============================================================
// MES AUDITS
// ============================================================

VIEWS['mes-audits'] = () => `
  <div class="topbar">
    <div class="topbar-title">Mes audits — 2025</div>
    <button class="btn-primary" onclick="showNewAuditModal()">+ Nouvel audit</button>
  </div>
  <div class="content">
    <div style="display:flex;gap:8px;margin-bottom:1rem">
      <select id="f-type" onchange="renderAuditList()"><option value="all">Process + BU</option><option value="Process">Process Audits</option><option value="BU">BU Audits</option></select>
      <select id="f-status" onchange="renderAuditList()"><option value="all">Tous statuts</option><option>Exécution</option><option>Préparation</option><option>Revue</option><option>Planifié</option><option>Clôturé</option></select>
    </div>
    <div class="audit-list" id="audit-list"></div>
  </div>`;

VIEWS_INIT['mes-audits'] = () => renderAuditList();

function renderAuditList() {
  const ft = document.getElementById('f-type')?.value || 'all';
  const fs = document.getElementById('f-status')?.value || 'all';
  const rows = STATE.audits.filter(a => (ft==='all'||a.type===ft) && (fs==='all'||a.status===fs));
  document.getElementById('audit-list').innerHTML = rows.length
    ? rows.map(a => `
        <div class="audit-row" onclick="openAudit('${a.id}')">
          <div style="flex:1">
            <div class="audit-name">${a.name}</div>
            <div class="audit-meta">${a.ent} · ${a.resp} · ${MONTHS[a.start]}–${MONTHS[Math.min(a.start+a.dur-1,11)]} 2025</div>
          </div>
          <span class="badge ${BADGE.type[a.type]||''}">${a.type}</span>
          ${badge(a.status)}
          <div>${pbar(a.status)}<div style="font-size:10px;color:var(--text-3);text-align:right;margin-top:2px">${PRCT[a.status]||0}%</div></div>
        </div>`).join('')
    : '<div style="font-size:12px;color:var(--text-3);padding:1rem 0">Aucun audit trouvé.</div>';
}

function showNewAuditModal() {
  openModal('Nouvel audit', `
    <div><label>Nom de la mission</label><input id="m-name" placeholder="ex : BU Romania 2025"/></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <div><label>Type</label><select id="m-type"><option value="Process">Process Audit</option><option value="BU">BU Audit</option></select></div>
      <div><label>Entité</label><select id="m-ent"><option>74S</option><option>SBS</option><option>AXWAY</option><option>Groupe</option></select></div>
    </div>
    <div><label>Responsable</label><select id="m-resp"><option value="Selma H.">Selma H.</option><option value="Nisrine E.">Nisrine E.</option></select></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <div><label>Mois de début</label><select id="m-start">${MONTHS.map((m,i)=>`<option value="${i}">${m}</option>`).join('')}</select></div>
      <div><label>Durée</label><select id="m-dur"><option value="2">2 mois</option><option value="3" selected>3 mois</option><option value="4">4 mois</option><option value="6">6 mois</option></select></div>
    </div>
    <div><label>Assigné à</label>
      <div style="display:flex;gap:8px;margin-top:4px">
        <label style="display:flex;align-items:center;gap:5px;font-size:12px"><input type="checkbox" id="a-sh" checked> Selma H.</label>
        <label style="display:flex;align-items:center;gap:5px;font-size:12px"><input type="checkbox" id="a-ne"> Nisrine E.</label>
      </div>
    </div>`,
    () => {
      const name = document.getElementById('m-name').value.trim();
      if (!name) { toast('Veuillez saisir un nom'); return; }
      const assigned = [];
      if (document.getElementById('a-sh').checked) assigned.push('sh');
      if (document.getElementById('a-ne').checked) assigned.push('ne');
      const id = 'a' + Date.now();
      STATE.audits.push({
        id, name,
        type: document.getElementById('m-type').value,
        ent:  document.getElementById('m-ent').value,
        resp: document.getElementById('m-resp').value,
        start: parseInt(document.getElementById('m-start').value),
        dur:   parseInt(document.getElementById('m-dur').value),
        status: 'Planifié', step: 0,
        assignedTo: assigned,
      });
      toast('Audit créé ✓');
      navigate('mes-audits');
    }
  );
}

// ============================================================
// DÉTAIL AUDIT
// ============================================================

let curAuditId = null;
let curStep = 0;
let curDetTab = 'roles';

function openAudit(id) {
  curAuditId = id;
  const audit = STATE.audits.find(a => a.id === id);
  if (!audit) return;
  curStep = audit.step || 0;
  navigate('audit-detail');
}

VIEWS['audit-detail'] = () => {
  const audit = STATE.audits.find(a => a.id === curAuditId);
  if (!audit) return '<div class="content">Audit introuvable.</div>';
  const tasks = getAuditTasks(audit);
  const allTasks = tasks.flat();
  const donePct = allTasks.length ? Math.round(allTasks.filter(t=>t.done).length / allTasks.length * 100) : 0;

  return `
  <div class="topbar">
    <div style="display:flex;align-items:center;gap:8px">
      <button class="btn-secondary" onclick="navigate('mes-audits')">← Retour</button>
      <div class="topbar-title">${audit.name}</div>
    </div>
    <div style="display:flex;gap:7px">
      <button class="btn-secondary">Exporter PDF</button>
      <button class="btn-primary" onclick="validerEtape()">Valider l'étape →</button>
    </div>
  </div>
  <div class="content">
    <div class="card" style="margin-bottom:1rem;display:flex;align-items:center;justify-content:space-between">
      <div>
        <div style="font-size:14px;font-weight:600">${audit.name}</div>
        <div style="font-size:11px;color:var(--text-2);margin-top:2px">${audit.ent} · ${audit.type} Audit · ${MONTHS[audit.start]}–${MONTHS[Math.min(audit.start+audit.dur-1,11)]} 2025</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        ${(audit.assignedTo||[]).map(id => {
          const m = TEAM_MEMBERS[id];
          if (!m) return '';
          return `<div style="width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;${AV_STYLES[id]}" title="${m.name}">${m.short}</div>`;
        }).join('')}
        <div style="font-size:11px;color:var(--text-2)">Valideur : <strong>Philippe M.</strong></div>
      </div>
    </div>

    <!-- PROGRESS -->
    <div class="card" style="display:flex;align-items:center;gap:12px;margin-bottom:1rem">
      <span style="font-size:11px;color:var(--text-2);white-space:nowrap" id="gp-step">Étape ${curStep+1} / 11</span>
      <div style="flex:1;height:5px;background:var(--bg);border-radius:3px;overflow:hidden">
        <div style="height:100%;border-radius:3px;background:var(--purple);width:${Math.round(curStep/10*100)}%" id="gp-fill"></div>
      </div>
      <span style="font-size:11px;color:var(--text-2)" id="gp-pct">${Math.round(curStep/10*100)}%</span>
    </div>

    <!-- STEPPER -->
    <div class="card stepper-wrap" style="margin-bottom:1rem" id="stepper-card">
      ${renderStepper(curStep, tasks)}
    </div>

    <!-- TABS -->
    <div class="tabs">
      <div class="tab ${curDetTab==='roles'?'active':''}" onclick="switchDetTab('roles')">Rôles & validation</div>
      <div class="tab ${curDetTab==='tasks'?'active':''}" onclick="switchDetTab('tasks')">Tâches</div>
      <div class="tab ${curDetTab==='docs'?'active':''}"  onclick="switchDetTab('docs')">Documents</div>
      <div class="tab ${curDetTab==='notes'?'active':''}" onclick="switchDetTab('notes')">Notes</div>
    </div>

    <div id="det-tab-content">${renderDetTab(audit, tasks)}</div>
  </div>`;
};

VIEWS_INIT['audit-detail'] = () => {};

function renderStepper(activeStep, tasks) {
  const phases = [[0,1,2],[3,4,5],[6,7,8,9,10]];
  const phaseLabels = ['Préparation','Réalisation','Restitution'];
  return phases.map((idxs, pi) => `
    <div class="phase-label">${phaseLabels[pi]}</div>
    <div class="step-row" style="margin-bottom:${pi<2?'1rem':'0'}">
      ${idxs.map(i => {
        const cls = i < activeStep ? 'done' : i === activeStep ? 'active' : '';
        const label = STEPS[i].l.replace('\n','<br>');
        const inner = i < activeStep ? '✓' : i+1;
        const stepTasks = tasks[i] || [];
        const assigned = [...new Set(stepTasks.map(t=>t.assignee).filter(a=>a&&a!=='none'&&TEAM_MEMBERS[a]))];
        const avs = assigned.map(id => `<div class="step-av" style="${AV_STYLES[id]}">${TEAM_MEMBERS[id].short}</div>`).join('');
        return `<div class="step-item ${cls}" onclick="goStep(${i})">
          <div class="step-circle">${inner}</div>
          <div class="step-label">${label}</div>
          <div class="step-avs">${avs}</div>
        </div>`;
      }).join('')}
    </div>`).join('');
}

function renderDetTab(audit, tasks) {
  const s = STEPS[curStep];
  const stepTasks = tasks[curStep] || [];
  const done = stepTasks.filter(t=>t.done).length;

  if (curDetTab === 'roles') {
    const assigned = audit.assignedTo || ['sh'];
    return `<div class="card">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.875rem">
        <div style="font-size:13px;font-weight:600">Étape ${curStep+1} — ${s.s}</div>
        ${badge(audit.status)}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:.875rem">
        ${assigned.map(id => {
          const m = TEAM_MEMBERS[id];
          if (!m) return '';
          const myTasks = stepTasks.filter(t => t.assignee === id);
          const myDone  = myTasks.filter(t => t.done).length;
          return `<div class="role-card">
            <div class="role-label">Auditrice assignée</div>
            <div class="role-user">
              <div style="width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;${AV_STYLES[id]}">${m.short}</div>
              <div>
                <div style="font-size:12px;font-weight:500">${m.name}</div>
                <div style="font-size:10px;color:${myDone===myTasks.length&&myTasks.length>0?'#3B6D11':'#854F0B'}">${myTasks.length > 0 ? `${myDone}/${myTasks.length} tâches` : 'Aucune tâche assignée'}</div>
              </div>
            </div>
          </div>`;
        }).join('')}
        <div class="role-card">
          <div class="role-label">Valideur</div>
          <div class="role-user">
            <div style="width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;${AV_STYLES.pm}">PM</div>
            <div>
              <div style="font-size:12px;font-weight:500">Philippe M.</div>
              <div style="font-size:10px;color:#854F0B">En attente de validation</div>
            </div>
          </div>
        </div>
      </div>
      <div style="font-size:11px;color:var(--text-2)">L'étape "${s.s}" doit être validée par Philippe M. avant de passer à la suivante.</div>
    </div>`;
  }

  if (curDetTab === 'tasks') {
    return `<div class="card">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.875rem">
        <div style="font-size:13px;font-weight:600">Tâches — ${s.s}</div>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:11px;color:var(--text-2)">${done}/${stepTasks.length} complétées</span>
          <button class="btn-secondary" style="font-size:11px" onclick="showNewTaskModal()">+ Ajouter</button>
        </div>
      </div>
      <div id="task-list">${renderTaskList(stepTasks, audit)}</div>
    </div>`;
  }

  if (curDetTab === 'docs') {
    return `<div class="card">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.875rem">
        <div style="font-size:13px;font-weight:600">Documents</div>
        <button class="btn-secondary" style="font-size:11px" onclick="document.getElementById('file-input').click()">+ Ajouter</button>
      </div>
      <input type="file" id="file-input" style="display:none" onchange="handleFileUpload(this)"/>
      <div class="upload-zone" onclick="document.getElementById('file-input').click()">
        <div style="font-size:12px;color:var(--text-2)">Glissez vos fichiers ou cliquez pour parcourir</div>
        <div style="font-size:10px;color:var(--text-3);margin-top:2px">PDF, Excel, Word, PowerPoint · max 20 Mo</div>
      </div>
      <div id="doc-list">${renderDocList(audit.id)}</div>
    </div>`;
  }

  if (curDetTab === 'notes') {
    return `<div class="card">
      <div style="font-size:13px;font-weight:600;margin-bottom:.75rem">Notes de l'auditeur</div>
      <textarea style="width:100%;min-height:120px;resize:vertical" placeholder="Observations, constats préliminaires..." id="notes-area">${audit.notes || ''}</textarea>
      <div style="display:flex;justify-content:flex-end;margin-top:8px">
        <button class="btn-primary" onclick="saveNotes()">Sauvegarder</button>
      </div>
    </div>`;
  }

  return '';
}

function renderTaskList(stepTasks, audit) {
  if (!stepTasks.length) return '<div style="font-size:12px;color:var(--text-3);padding:.5rem 0">Aucune tâche — cliquez sur + Ajouter.</div>';
  return stepTasks.map((t, i) => {
    const m = t.assignee !== 'none' && TEAM_MEMBERS[t.assignee] ? TEAM_MEMBERS[t.assignee] : null;
    return `<div class="task-item">
      <div class="task-cb ${t.done?'done':''}" onclick="toggleTask(${i})">${t.done?'✓':''}</div>
      <div class="task-text ${t.done?'done-txt':''}">${t.desc}</div>
      <select style="font-size:11px;padding:2px 6px;border-radius:20px;background:${m?'':'var(--bg)'}" onchange="reassignTask(${i},this.value)">
        <option value="none" ${!m?'selected':''}>— Non assignée</option>
        ${(audit.assignedTo||[]).map(id => `<option value="${id}" ${t.assignee===id?'selected':''}>${TEAM_MEMBERS[id]?.name||id}</option>`).join('')}
      </select>
      <span style="font-size:10px;color:${t.done?'#3B6D11':m?'#534AB7':'var(--text-3)'}">${t.done?'✓ Fait':m?'En cours':'À faire'}</span>
    </div>`;
  }).join('');
}

function renderDocList(auditId) {
  const docs = STATE.docs?.[auditId] || [];
  if (!docs.length) return '';
  return docs.map(d => `
    <div style="display:flex;align-items:center;gap:7px;font-size:11px;color:var(--text-2);background:var(--bg);padding:5px 9px;border-radius:var(--radius);margin-bottom:5px">
      <span style="color:var(--purple)">▣</span>${d.name}
      <span style="margin-left:auto;color:var(--text-3)">${d.size}</span>
    </div>`).join('');
}

function switchDetTab(tab) {
  curDetTab = tab;
  const audit = STATE.audits.find(a => a.id === curAuditId);
  const tasks = getAuditTasks(audit);
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  document.getElementById('det-tab-content').innerHTML = renderDetTab(audit, tasks);
}

function goStep(i) {
  curStep = i;
  const audit = STATE.audits.find(a => a.id === curAuditId);
  const tasks = getAuditTasks(audit);
  document.getElementById('stepper-card').innerHTML = renderStepper(curStep, tasks);
  document.getElementById('gp-fill').style.width = Math.round(curStep/10*100) + '%';
  document.getElementById('gp-pct').textContent = Math.round(curStep/10*100) + '%';
  document.getElementById('gp-step').textContent = `Étape ${curStep+1} / 11 — ${STEPS[curStep].s}`;
  document.getElementById('det-tab-content').innerHTML = renderDetTab(audit, tasks);
}

function validerEtape() {
  const audit = STATE.audits.find(a => a.id === curAuditId);
  if (!audit) return;
  if (curStep < 10) {
    curStep++;
    audit.step = curStep;
    const statuses = ['Préparation','Préparation','Préparation','Exécution','Exécution','Exécution','Revue','Revue','Revue','Restitution','Clôturé'];
    audit.status = statuses[curStep];
    const tasks = getAuditTasks(audit);
    document.getElementById('stepper-card').innerHTML = renderStepper(curStep, tasks);
    document.getElementById('gp-fill').style.width = Math.round(curStep/10*100) + '%';
    document.getElementById('gp-pct').textContent = Math.round(curStep/10*100) + '%';
    document.getElementById('gp-step').textContent = `Étape ${curStep+1} / 11 — ${STEPS[curStep].s}`;
    document.getElementById('det-tab-content').innerHTML = renderDetTab(audit, tasks);
    toast(`"${STEPS[curStep].s}" — étape validée par Philippe ✓`);
    if (STATE.connected) STATE.sp?.updateAudit(audit.id, { Etape: String(curStep), Statut: audit.status });
  } else {
    toast('Mission clôturée — toutes les étapes sont complètes ✓');
  }
}

function toggleTask(i) {
  const audit = STATE.audits.find(a => a.id === curAuditId);
  const tasks = getAuditTasks(audit);
  tasks[curStep][i].done = !tasks[curStep][i].done;
  const stepTasks = tasks[curStep];
  document.getElementById('task-list').innerHTML = renderTaskList(stepTasks, audit);
  document.getElementById('stepper-card').innerHTML = renderStepper(curStep, tasks);
}

function reassignTask(i, val) {
  const audit = STATE.audits.find(a => a.id === curAuditId);
  const tasks = getAuditTasks(audit);
  tasks[curStep][i].assignee = val;
  if (val !== 'none') toast(`Tâche assignée à ${TEAM_MEMBERS[val]?.name}`);
  document.getElementById('stepper-card').innerHTML = renderStepper(curStep, tasks);
}

function showNewTaskModal() {
  const audit = STATE.audits.find(a => a.id === curAuditId);
  openModal('Nouvelle tâche', `
    <div><label>Description</label><input id="t-desc" placeholder="ex : Analyser les données OTC..."/></div>
    <div><label>Assignée à</label>
      <select id="t-assign">
        <option value="none">— Non assignée</option>
        ${(audit.assignedTo||[]).map(id=>`<option value="${id}">${TEAM_MEMBERS[id]?.name||id}</option>`).join('')}
      </select>
    </div>`,
    () => {
      const desc = document.getElementById('t-desc').value.trim();
      if (!desc) { toast('Veuillez décrire la tâche'); return; }
      const tasks = getAuditTasks(audit);
      tasks[curStep].push({ id: Date.now()+'', auditId: curAuditId, stepIndex: curStep, desc, assignee: document.getElementById('t-assign').value, done: false });
      document.getElementById('det-tab-content').innerHTML = renderDetTab(audit, tasks);
      toast('Tâche créée ✓');
    }
  );
}

function handleFileUpload(input) {
  if (!input.files.length) return;
  const file = input.files[0];
  if (!STATE.docs) STATE.docs = {};
  if (!STATE.docs[curAuditId]) STATE.docs[curAuditId] = [];
  STATE.docs[curAuditId].push({ name: file.name, size: (file.size < 1024*1024 ? Math.round(file.size/1024)+'Ko' : (file.size/1024/1024).toFixed(1)+'Mo') });
  if (STATE.connected && STATE.sp) STATE.sp.uploadDocument(curAuditId, file);
  document.getElementById('doc-list').innerHTML = renderDocList(curAuditId);
  toast('Fichier ajouté ✓');
}

function saveNotes() {
  const audit = STATE.audits.find(a => a.id === curAuditId);
  if (audit) audit.notes = document.getElementById('notes-area').value;
  toast('Notes sauvegardées ✓');
}

// ============================================================
// PLANIFICATION GANTT
// ============================================================

VIEWS['planification'] = () => `
  <div class="topbar"><div class="topbar-title">Planification 2025</div></div>
  <div class="content">
    <div style="display:flex;gap:8px;margin-bottom:1rem">
      <select id="f-pl-type" onchange="renderGantt()"><option value="all">Process + BU</option><option value="Process">Process Audits</option><option value="BU">BU Audits</option></select>
    </div>
    <div class="gantt-wrap" id="gantt-wrap"></div>
  </div>`;

VIEWS_INIT['planification'] = () => renderGantt();

function renderGantt() {
  const ft = document.getElementById('f-pl-type')?.value || 'all';
  const rows = STATE.audits.filter(a => ft==='all' || a.type===ft);
  const months = MONTHS.map((m,i) => `<div class="gantt-cell${i===8?' today-col':''}">${m}</div>`).join('');
  const header = `<div class="gantt-row gantt-hdr"><div class="gantt-cell" style="text-align:left;padding-left:8px">Audit</div>${months}</div>`;
  const body = rows.map((a, idx) => {
    const cells = MONTHS.map((_,m) => {
      const hasBar = m >= a.start && m < a.start + a.dur;
      return `<div class="gantt-month${m===8?' today-col':''}">
        ${hasBar ? `<div class="gantt-bar" style="background:${GANTT_COLORS[idx%GANTT_COLORS.length]}"></div>` : ''}
      </div>`;
    }).join('');
    return `<div class="gantt-row" style="border-bottom:.5px solid var(--border)">
      <div class="gantt-name">
        <span class="badge ${BADGE.type[a.type]||''}" style="font-size:9px;padding:1px 5px">${a.type==='Process'?'P':'BU'}</span>
        ${a.name.length > 15 ? a.name.slice(0,14)+'…' : a.name}
      </div>
      ${cells}
    </div>`;
  }).join('');
  document.getElementById('gantt-wrap').innerHTML = header + body;
}

// ============================================================
// PLAN PROCESS
// ============================================================

VIEWS['plan-process'] = () => `
  <div class="topbar">
    <div class="topbar-title">Plan Process 2025–2028</div>
    <div style="display:flex;gap:7px">
      <button class="btn-secondary" onclick="toggleShowArchived()">Afficher archivés</button>
      <button class="btn-primary admin-only" onclick="showNewProcessModal()">+ Ajouter</button>
    </div>
  </div>
  <div class="content"><div class="table-wrap"><table id="proc-table"></table></div></div>`;

VIEWS_INIT['plan-process'] = () => renderProcessTable();

let showArchived = false;
function toggleShowArchived() { showArchived = !showArchived; renderProcessTable(); }

function renderProcessTable() {
  const doms = [...new Set(STATE.processes.map(p=>p.dom))];
  let h = `<thead><tr><th>Domaine</th><th>Processus</th><th style="text-align:center">Risque</th><th>2025</th><th>2026</th><th>2027</th><th>2028</th><th>Statut</th>${STATE.user?.role==='admin'?'<th>Actions</th>':''}</tr></thead><tbody>`;
  doms.forEach(dom => {
    const rows = STATE.processes.filter(p => p.dom===dom && (showArchived||!p.archived));
    if (!rows.length) return;
    h += `<tr class="section-row"><td colspan="9">${dom}</td></tr>`;
    rows.forEach(p => {
      const idx = STATE.processes.indexOf(p);
      const yc = y => y ? `${ENT_TAG[y.e]||''} <span style="font-size:10px">${y.l}</span>` : '<span style="color:var(--text-3)">—</span>';
      h += `<tr style="${p.archived?'opacity:.5':''}">
        <td style="font-size:11px;color:var(--text-2)">${dom}</td>
        <td style="font-weight:500;font-size:11px">${p.proc}</td>
        <td style="text-align:center">
          ${STATE.user?.role==='admin'
            ? `<select style="font-size:10px;padding:2px 4px;border:none;background:transparent;cursor:pointer" onchange="editRisk(${idx},this.value)"><option value="1" ${p.risk===1?'selected':''}>★</option><option value="2" ${p.risk===2?'selected':''}>★★</option><option value="3" ${p.risk===3?'selected':''}>★★★</option></select>`
            : RS[p.risk]}
        </td>
        <td>${yc(p.y25)}</td><td>${yc(p.y26)}</td><td>${yc(p.y27)}</td><td>${yc(p.y28)}</td>
        <td><span class="badge ${p.archived?'badge-planned':'badge-done'}">${p.archived?'Archivé':'Actif'}</span></td>
        ${STATE.user?.role==='admin' ? `<td><button class="btn-secondary" style="font-size:10px;padding:2px 7px" onclick="${p.archived?`restoreProcess(${idx})`:`archiveProcess(${idx})`}">${p.archived?'Restaurer':'Archiver'}</button></td>` : ''}
      </tr>`;
    });
  });
  h += '</tbody>';
  document.getElementById('proc-table').innerHTML = h;
}

function editRisk(idx, val) {
  const old = STATE.processes[idx].risk;
  STATE.processes[idx].risk = parseInt(val);
  const stars={1:'★',2:'★★',3:'★★★'};
  addHistory('edit', `Risque "${STATE.processes[idx].proc}" modifié : ${stars[old]} → ${stars[val]}`);
  toast('Risque mis à jour');
}
function archiveProcess(idx) { STATE.processes[idx].archived=true; addHistory('arch',`Process "${STATE.processes[idx].proc}" archivé`); renderProcessTable(); toast('Archivé'); }
function restoreProcess(idx){ STATE.processes[idx].archived=false; addHistory('add',`Process "${STATE.processes[idx].proc}" restauré`);  renderProcessTable(); toast('Restauré'); }

function showNewProcessModal() {
  openModal('Ajouter un process', `
    <div><label>Domaine</label><select id="m-dom"><option>Governance</option><option>Edition</option><option>Deployment</option><option>Distribution</option><option>Support Functions</option></select></div>
    <div><label>Nom du processus</label><input id="m-proc" placeholder="ex : ESG / Sustainability"/></div>
    <div><label>Cotation risque</label><select id="m-risk"><option value="1">★ Faible</option><option value="2">★★ Moyen</option><option value="3">★★★ Élevé</option></select></div>`,
    () => {
      const proc = document.getElementById('m-proc').value.trim();
      if (!proc) { toast('Veuillez saisir un nom'); return; }
      STATE.processes.push({ id:'p'+Date.now(), dom:document.getElementById('m-dom').value, proc, risk:parseInt(document.getElementById('m-risk').value), archived:false, y25:null,y26:null,y27:null,y28:null });
      addHistory('add', `Process "${proc}" ajouté`);
      renderProcessTable(); toast('Process ajouté ✓');
    }
  );
}

// ============================================================
// PLAN BU
// ============================================================

VIEWS['plan-bu'] = () => `
  <div class="topbar">
    <div class="topbar-title">Plan BU 2025–2028</div>
    <div style="display:flex;gap:7px">
      <select id="f-bu-ent" onchange="renderBUTable()"><option value="all">SBS + AXWAY</option><option value="SBS">SBS</option><option value="AXWAY">AXWAY</option></select>
      <select id="f-bu-reg" onchange="renderBUTable()"><option value="all">Toutes régions</option><option>Europe</option><option>AMEE</option><option>North America</option><option>APAC</option><option>South America</option></select>
      <select id="f-bu-pri" onchange="renderBUTable()"><option value="all">Toutes priorités</option><option>High</option><option>Mid</option><option>Low</option></select>
      <button class="btn-primary admin-only" onclick="showNewBUModal()">+ Ajouter</button>
    </div>
  </div>
  <div class="content"><div class="table-wrap"><table id="bu-table"></table></div></div>`;

VIEWS_INIT['plan-bu'] = () => {
  // Charge les BUs depuis sharepoint si connecté, sinon depuis le fichier de données
  if (!STATE.buPlan.length) {
    STATE.buPlan = LOCAL_BU_PLAN;
  }
  renderBUTable();
};

function renderBUTable() {
  const fe = document.getElementById('f-bu-ent')?.value || 'all';
  const fr = document.getElementById('f-bu-reg')?.value || 'all';
  const fp = document.getElementById('f-bu-pri')?.value || 'all';
  const rows = STATE.buPlan.filter(b => (fe==='all'||b.ent===fe) && (fr==='all'||b.reg===fr) && (fp==='all'||b.pri===fp));
  const regs = [...new Set(rows.map(b=>b.reg))];
  let h = `<thead><tr><th>Entité</th><th>Région</th><th>Pays</th><th>Risque</th><th style="text-align:center">Emp.</th><th>Priorité</th><th>Type</th><th>2025</th><th>2026</th><th>2027</th><th>2028</th>${STATE.user?.role==='admin'?'<th>Actions</th>':''}</tr></thead><tbody>`;
  regs.forEach(reg => {
    const rrows = rows.filter(b=>b.reg===reg);
    h += `<tr class="section-row"><td colspan="12">${reg}</td></tr>`;
    rrows.forEach(b => {
      const idx = STATE.buPlan.indexOf(b);
      const yc = v => v ? `<span style="font-size:10px;background:var(--purple-lt);color:var(--purple-dk);padding:2px 5px;border-radius:3px">${v}</span>` : '<span style="color:var(--text-3)">—</span>';
      h += `<tr style="${b.archived?'opacity:.5':''}">
        <td>${b.ent==='SBS'?'<span class="badge badge-sbs">SBS</span>':'<span class="badge badge-axw">AXWAY</span>'}</td>
        <td style="color:var(--text-2);font-size:11px">${b.reg}</td>
        <td style="font-weight:500;font-size:11px">${b.pays}</td>
        <td style="font-size:10px;color:var(--text-2)">${b.risk||'—'}</td>
        <td style="text-align:center;color:var(--text-2)">${b.emp||'—'}</td>
        <td>${STATE.user?.role==='admin'
          ? `<select style="font-size:10px;padding:2px 5px;border:.5px solid var(--border-md);border-radius:4px;background:var(--bg-card)" onchange="editBUPri(${idx},this.value)"><option value="High" ${b.pri==='High'?'selected':''}>High</option><option value="Mid" ${b.pri==='Mid'?'selected':''}>Mid</option><option value="Low" ${b.pri==='Low'?'selected':''}>Low</option></select>`
          : `<span class="badge badge-${b.pri?.toLowerCase()}">${b.pri}</span>`}
        </td>
        <td style="font-size:10px;color:var(--text-2)">${b.type||'TBD'}</td>
        <td>${yc(b.y25)}</td><td>${yc(b.y26)}</td><td>${yc(b.y27)}</td><td>${yc(b.y28)}</td>
        ${STATE.user?.role==='admin' ? `<td style="white-space:nowrap">
          <button class="btn-secondary" style="font-size:10px;padding:2px 7px" onclick="${b.archived?`restoreBU(${idx})`:`archiveBU(${idx})`}">${b.archived?'Restaurer':'Archiver'}</button>
        </td>` : ''}
      </tr>`;
    });
  });
  h += '</tbody>';
  document.getElementById('bu-table').innerHTML = h;
}

function editBUPri(idx, val) {
  const old = STATE.buPlan[idx].pri;
  STATE.buPlan[idx].pri = val;
  addHistory('edit', `Priorité BU "${STATE.buPlan[idx].pays}" : ${old} → ${val}`);
  toast('Priorité mise à jour');
}
function archiveBU(idx) { STATE.buPlan[idx].archived=true; addHistory('arch',`BU "${STATE.buPlan[idx].pays}" archivée`); renderBUTable(); toast('BU archivée'); }
function restoreBU(idx){ STATE.buPlan[idx].archived=false; addHistory('add',`BU "${STATE.buPlan[idx].pays}" restaurée`);  renderBUTable(); toast('BU restaurée'); }

function showNewBUModal() {
  openModal('Ajouter une BU', `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <div><label>Entité</label><select id="m-ent"><option>SBS</option><option>AXWAY</option></select></div>
      <div><label>Région</label><select id="m-reg"><option>Europe</option><option>AMEE</option><option>North America</option><option>APAC</option><option>South America</option></select></div>
    </div>
    <div><label>Pays / BU</label><input id="m-pays" placeholder="ex : Portugal"/></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <div><label>Nb employés</label><input id="m-emp" type="number" placeholder="ex : 45"/></div>
      <div><label>Priorité</label><select id="m-pri"><option>High</option><option>Mid</option><option>Low</option></select></div>
    </div>
    <div><label>Risque spécifique</label><input id="m-risk" placeholder="ex : OTC, HR..."/></div>
    <div><label>Type d'audit</label><select id="m-type"><option>On Site</option><option>Remote</option><option>TBD</option></select></div>`,
    () => {
      const pays = document.getElementById('m-pays').value.trim();
      if (!pays) { toast('Veuillez saisir un pays'); return; }
      STATE.buPlan.push({ id:'bu'+Date.now(), ent:document.getElementById('m-ent').value, reg:document.getElementById('m-reg').value, pays, risk:document.getElementById('m-risk').value||'—', emp:parseInt(document.getElementById('m-emp').value)||null, pri:document.getElementById('m-pri').value, type:document.getElementById('m-type').value, archived:false });
      addHistory('add', `BU "${pays}" ajoutée`);
      renderBUTable(); toast('BU ajoutée ✓');
    }
  );
}

// ============================================================
// HISTORIQUE
// ============================================================

VIEWS['historique'] = () => `
  <div class="topbar"><div class="topbar-title">Historique des modifications</div></div>
  <div class="content">
    <div class="card" id="hist-list"></div>
  </div>`;

VIEWS_INIT['historique'] = async () => {
  if (STATE.connected && STATE.sp && !STATE.history.length) {
    STATE.history = await STATE.sp.getHistory();
  }
  const dots = { add:'#3B6D11', edit:'#534AB7', arch:'#854F0B', del:'#A32D2D' };
  document.getElementById('hist-list').innerHTML = STATE.history.length
    ? STATE.history.map(h => `
        <div style="display:flex;gap:10px;padding:.625rem 0;border-bottom:.5px solid var(--border)">
          <div style="width:8px;height:8px;border-radius:50%;background:${dots[h.type]||'#534AB7'};margin-top:4px;flex-shrink:0"></div>
          <div style="flex:1">
            <div style="font-size:12px;color:var(--text)">${h.msg}</div>
            <div style="font-size:10px;color:var(--text-3);margin-top:2px">${h.user} · ${h.date}</div>
          </div>
        </div>`).join('')
    : '<div style="font-size:12px;color:var(--text-3);padding:.5rem 0">Aucune modification enregistrée.</div>';
};

// ============================================================
// PLANS D'ACTION
// ============================================================

VIEWS['plans-action'] = () => `
  <div class="topbar">
    <div class="topbar-title">Suivi des plans d'action</div>
    <button class="btn-primary" onclick="showNewActionModal()">+ Ajouter</button>
  </div>
  <div class="content">
    <div class="metrics">
      <div class="card metric-card"><div class="metric-label">Total</div><div class="metric-value">${STATE.actions.length}</div></div>
      <div class="card metric-card"><div class="metric-label">En cours</div><div class="metric-value" style="color:#534AB7">${STATE.actions.filter(a=>a.status==='En cours').length}</div></div>
      <div class="card metric-card"><div class="metric-label">En retard</div><div class="metric-value" style="color:#A32D2D">${STATE.actions.filter(a=>a.status==='En retard').length}</div></div>
      <div class="card metric-card"><div class="metric-label">Clôturés</div><div class="metric-value" style="color:#3B6D11">${STATE.actions.filter(a=>a.status==='Clôturé').length}</div></div>
    </div>
    <div style="display:flex;gap:8px;margin-bottom:1rem">
      <select id="f-pa-status" onchange="renderActionList()"><option value="all">Tous statuts</option><option>En cours</option><option>En retard</option><option>Non démarré</option><option>Clôturé</option></select>
    </div>
    <div id="action-list"></div>
  </div>`;

VIEWS_INIT['plans-action'] = () => renderActionList();

function renderActionList() {
  const fs = document.getElementById('f-pa-status')?.value || 'all';
  const rows = STATE.actions.filter(a => fs==='all' || a.status===fs);
  const fillColor = { 'En retard':'#A32D2D', 'Clôturé':'#3B6D11', 'Non démarré':'#888780', 'En cours':'#534AB7' };
  document.getElementById('action-list').innerHTML = rows.map(a => `
    <div class="card" style="margin-bottom:6px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px">
        <div style="font-size:12px;font-weight:500;flex:1">${a.title}</div>
        ${badge(a.status)}
        <span class="badge badge-grp">${a.ent}</span>
      </div>
      <div style="font-size:11px;color:var(--text-2);margin-bottom:6px">Audit : ${a.audit} · Resp. : ${a.resp} · Éch. : ${a.due}</div>
      <div style="display:flex;align-items:center;gap:8px">
        <div style="flex:1;height:5px;background:var(--bg);border-radius:3px;overflow:hidden">
          <div style="height:100%;border-radius:3px;background:${fillColor[a.status]||'#534AB7'};width:${a.pct}%"></div>
        </div>
        <span style="font-size:10px;color:var(--text-3)">${a.pct}%</span>
      </div>
    </div>`).join('') || '<div style="font-size:12px;color:var(--text-3);padding:.5rem 0">Aucun plan d\'action.</div>';
}

function showNewActionModal() {
  openModal('Nouveau plan d\'action', `
    <div><label>Titre</label><input id="pa-title" placeholder="ex : Revue des accès ERP"/></div>
    <div><label>Lié à l'audit</label><select id="pa-audit">${STATE.audits.map(a=>`<option>${a.name}</option>`).join('')}</select></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <div><label>Responsable</label><select id="pa-resp"><option value="Selma H.">Selma H.</option><option value="Nisrine E.">Nisrine E.</option></select></div>
      <div><label>Entité</label><select id="pa-ent"><option>Groupe</option><option>74S</option><option>SBS</option><option>AXWAY</option></select></div>
    </div>
    <div><label>Échéance</label><input id="pa-due" placeholder="ex : 31 déc. 2025"/></div>`,
    () => {
      const title = document.getElementById('pa-title').value.trim();
      if (!title) { toast('Veuillez saisir un titre'); return; }
      STATE.actions.unshift({ id:'ac'+Date.now(), title, audit:document.getElementById('pa-audit').value, resp:document.getElementById('pa-resp').value, ent:document.getElementById('pa-ent').value, due:document.getElementById('pa-due').value||'À définir', status:'Non démarré', pct:0 });
      if (STATE.connected) STATE.sp?.createAction(STATE.actions[0]);
      renderActionList(); toast('Plan d\'action créé ✓');
    }
  );
}

// ============================================================
// MODÈLES
// ============================================================

VIEWS['modeles'] = () => `
  <div class="topbar"><div class="topbar-title">Modèles d'audit</div><button class="btn-primary">+ Nouveau modèle</button></div>
  <div class="content">
    <div class="tabs">
      <div class="tab active" onclick="switchTplTab(this,'tpl-proc')">Process Audits</div>
      <div class="tab" onclick="switchTplTab(this,'tpl-bu')">BU Audits</div>
    </div>
    <div id="tpl-proc" style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
      ${['Product Development','Cybersecurity & Data','Treasury & Tax','Sales & Services','P2P / Third Party','Governance'].map(n=>`
        <div class="card" style="display:flex;flex-direction:column;gap:6px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div style="font-size:12px;font-weight:500">${n}</div>
            <span class="badge badge-process">Process</span>
          </div>
          <div style="font-size:11px;color:var(--text-2)">5 phases · 11 étapes</div>
          <button class="btn-secondary" style="width:100%;text-align:center;margin-top:4px">Utiliser</button>
        </div>`).join('')}
    </div>
    <div id="tpl-bu" style="display:none;grid-template-columns:repeat(3,1fr);gap:10px">
      ${['Legal / Compliance','HR','Sales','Procurement','Accounting','Bank & Cash','IS/IT','Facilities'].map(n=>`
        <div class="card" style="display:flex;flex-direction:column;gap:6px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div style="font-size:12px;font-weight:500">${n}</div>
            <span class="badge badge-bu">BU</span>
          </div>
          <div style="font-size:11px;color:var(--text-2)">5 phases · 11 étapes</div>
          <button class="btn-secondary" style="width:100%;text-align:center;margin-top:4px">Utiliser</button>
        </div>`).join('')}
    </div>
  </div>`;

function switchTplTab(el, id) {
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('tpl-proc').style.display = id==='tpl-proc' ? 'grid' : 'none';
  document.getElementById('tpl-bu').style.display   = id==='tpl-bu'   ? 'grid' : 'none';
}

// ============================================================
// RÔLES & ACCÈS
// ============================================================

VIEWS['roles'] = () => `
  <div class="topbar">
    <div class="topbar-title">Rôles & Accès</div>
    <button class="btn-primary" onclick="showInviteModal()">+ Inviter</button>
  </div>
  <div class="content">
    <div class="table-wrap">
      <table>
        <thead><tr><th>Membre</th><th>Email</th><th>Rôle</th><th>Statut</th><th>Modifier</th></tr></thead>
        <tbody id="users-table"></tbody>
      </table>
    </div>
    <div class="card" style="margin-top:1rem;font-size:12px;color:var(--text-2);line-height:1.8">
      <strong style="color:var(--text)">Admin / Directeur</strong> — accès complet, modification des référentiels, validation de toutes les étapes, gestion des utilisateurs.<br>
      <strong style="color:var(--text)">Auditrice</strong> — voir tous les audits, remplir checklists, tâches et documents. Ne peut pas modifier les référentiels ni gérer les utilisateurs.<br>
      <strong style="color:var(--text)">Audité</strong> — consultation de ses audits uniquement, upload de documents, saisie des réponses management.
    </div>
  </div>`;

VIEWS_INIT['roles'] = () => renderUsersTable();

let USERS_STATE = [
  { name:'Philippe M.', email:'philippe.m@groupe.com', role:'admin',    status:'Actif' },
  { name:'Selma H.',    email:'selma.h@groupe.com',    role:'auditeur', status:'Actif' },
  { name:'Nisrine E.',  email:'nisrine.e@groupe.com',  role:'auditeur', status:'Actif' },
];

function renderUsersTable() {
  const ROLE_BADGE = { admin:'badge-admin', auditeur:'badge-auditeur', audite:'badge-audite' };
  const ROLE_LABEL = { admin:'Admin / Directeur', auditeur:'Auditrice', audite:'Audité' };
  document.getElementById('users-table').innerHTML = USERS_STATE.map((u,i) => `
    <tr>
      <td style="font-weight:500">${u.name}</td>
      <td style="color:var(--text-2);font-size:11px">${u.email}</td>
      <td><span class="badge ${ROLE_BADGE[u.role]||''}">${ROLE_LABEL[u.role]||u.role}</span></td>
      <td><span style="font-size:11px;color:#3B6D11">● ${u.status}</span></td>
      <td>
        <select style="font-size:11px;padding:3px 7px;border:.5px solid var(--border-md);border-radius:var(--radius);background:var(--bg-card)" onchange="changeUserRole(${i},this.value)">
          <option value="admin"    ${u.role==='admin'?'selected':''}>Admin / Directeur</option>
          <option value="auditeur" ${u.role==='auditeur'?'selected':''}>Auditrice</option>
          <option value="audite"   ${u.role==='audite'?'selected':''}>Audité</option>
        </select>
      </td>
    </tr>`).join('');
}

function changeUserRole(i, role) { USERS_STATE[i].role = role; renderUsersTable(); toast('Rôle mis à jour'); }

function showInviteModal() {
  openModal('Inviter un membre', `
    <div><label>Prénom Nom</label><input id="inv-name" placeholder="ex : Jean Martin"/></div>
    <div><label>Email professionnel</label><input id="inv-email" placeholder="jean.martin@groupe.com"/></div>
    <div><label>Rôle</label>
      <select id="inv-role">
        <option value="admin">Admin / Directeur</option>
        <option value="auditeur" selected>Auditrice / Auditeur</option>
        <option value="audite">Audité</option>
      </select>
    </div>`,
    () => {
      const name = document.getElementById('inv-name').value.trim();
      const email = document.getElementById('inv-email').value.trim();
      if (!name||!email) { toast('Veuillez remplir tous les champs'); return; }
      USERS_STATE.push({ name, email, role:document.getElementById('inv-role').value, status:'Invitation envoyée' });
      renderUsersTable(); toast(`Invitation envoyée à ${name} ✓`);
    }
  );
}

// Données BU (référence locale)
const LOCAL_BU_PLAN = [
  {id:'b1', ent:'SBS',   reg:'AMEE',          pays:'Maroc',        risk:'OTC',                     emp:183, pri:'High', type:'On Site', y25:'Maroc/Afrique', y26:null,      y27:null,          y28:null,             archived:false},
  {id:'b2', ent:'SBS',   reg:'AMEE',          pays:'Tunisie',      risk:'OTC',                     emp:71,  pri:'High', type:'On Site', y25:'Maroc/Afrique', y26:null,      y27:null,          y28:null,             archived:false},
  {id:'b3', ent:'SBS',   reg:'AMEE',          pays:'Cameroun',     risk:'OTC',                     emp:53,  pri:'High', type:'On Site', y25:'Maroc/Afrique', y26:null,      y27:null,          y28:null,             archived:false},
  {id:'b4', ent:'SBS',   reg:'AMEE',          pays:'Côte d\'Ivoire',risk:'OTC',                    emp:30,  pri:'High', type:'On Site', y25:'Maroc/Afrique', y26:null,      y27:null,          y28:null,             archived:false},
  {id:'b5', ent:'SBS',   reg:'AMEE',          pays:'Sénégal',      risk:'OTC',                     emp:9,   pri:'High', type:'On Site', y25:'Maroc/Afrique', y26:null,      y27:null,          y28:null,             archived:false},
  {id:'b6', ent:'SBS',   reg:'AMEE',          pays:'Liban',        risk:'HR / OTC',                emp:120, pri:'High', type:'On Site', y25:null,            y26:'Lebanon', y27:null,          y28:null,             archived:false},
  {id:'b7', ent:'SBS',   reg:'Europe',        pays:'UK',           risk:'Product PS / Spec Finance',emp:501,pri:'Mid',  type:'On Site', y25:null,            y26:'UK SBS',  y27:null,          y28:null,             archived:false},
  {id:'b8', ent:'AXWAY', reg:'Europe',        pays:'Romania',      risk:'HR (Key People)',          emp:267, pri:'Mid',  type:'On Site', y25:null,            y26:'Romania', y27:null,          y28:null,             archived:false},
  {id:'b9', ent:'AXWAY', reg:'Europe',        pays:'Bulgaria',     risk:'—',                       emp:155, pri:'Low',  type:'Remote',  y25:null,            y26:'Bulgaria',y27:null,          y28:null,             archived:false},
  {id:'b10',ent:'AXWAY', reg:'Europe',        pays:'Germany',      risk:'—',                       emp:65,  pri:'Low',  type:'Remote',  y25:null,            y26:'Germany', y27:null,          y28:null,             archived:false},
  {id:'b11',ent:'AXWAY', reg:'Europe',        pays:'Ireland',      risk:'HR/Qualité R&D',          emp:48,  pri:'Mid',  type:'TBD',     y25:null,            y26:null,      y27:'Ireland AXW', y28:null,             archived:false},
  {id:'b12',ent:'AXWAY', reg:'Europe',        pays:'Italy',        risk:'—',                       emp:10,  pri:'Low',  type:'TBD',     y25:null,            y26:null,      y27:'Italy',       y28:null,             archived:false},
  {id:'b13',ent:'AXWAY', reg:'APAC',          pays:'Hong Kong',    risk:'—',                       emp:3,   pri:'Low',  type:'TBD',     y25:null,            y26:null,      y27:'APAC',        y28:null,             archived:false},
  {id:'b14',ent:'SBS',   reg:'APAC',          pays:'Inde',         risk:'HR / Quality R&D',        emp:884, pri:'Mid',  type:'TBD',     y25:null,            y26:null,      y27:null,          y28:'Inde',           archived:false},
  {id:'b15',ent:'SBS',   reg:'Europe',        pays:'Luxembourg',   risk:'—',                       emp:81,  pri:'Mid',  type:'TBD',     y25:null,            y26:null,      y27:null,          y28:'Benelux/Nordics',archived:false},
  {id:'b16',ent:'AXWAY', reg:'South America', pays:'Brésil',       risk:'—',                       emp:28,  pri:'Low',  type:'TBD',     y25:null,            y26:null,      y27:null,          y28:'S. America',     archived:false},
];
