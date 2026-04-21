// ═══════════════════════════════════════════════════════════
//  graph.js — Couche données Microsoft Graph / SharePoint
//  Token obtenu directement via Azure Static Web Apps
//  (plus besoin de MSAL, plus de popup, plus de boucle)
// ═══════════════════════════════════════════════════════════

var DB = {
  users:     [],
  auditPlan: [],
  processes: [],
  actions:   [],
  auditData: {},
  history:   [],
};

// ── Token Microsoft Graph via Azure SWA ──────────────────────
var _graphToken = null;
var _graphTokenPromise = null;

// Stub pour compatibilité (plus utilisé, mais certaines parties du code peuvent l'appeler)
async function handleGraphRedirect() { return null; }

async function getGraphToken() {
  // Cache en mémoire
  if (_graphToken && _graphToken.exp > Date.now() + 60000) return _graphToken.token;

  // Cache sessionStorage
  try {
    var stored = sessionStorage.getItem('af_graph_token');
    if (stored) {
      var parsed = JSON.parse(stored);
      if (parsed && parsed.exp > Date.now() + 60000) {
        _graphToken = parsed;
        return _graphToken.token;
      }
    }
  } catch(e) {}

  // Verrou : si une acquisition est déjà en cours, attendre
  if (_graphTokenPromise) return _graphTokenPromise;

  _graphTokenPromise = _doGetGraphToken().finally(function() { _graphTokenPromise = null; });
  return _graphTokenPromise;
}

async function _doGetGraphToken() {
  try {
    // Appeler l'endpoint Azure SWA qui donne le token Graph
    var res = await fetch('/.auth/me');
    if (!res.ok) {
      console.warn('[Graph] /.auth/me returned', res.status);
      return null;
    }
    var data = await res.json();

    // Format Azure Static Web Apps : { clientPrincipal: {...} }
    // Le token Graph est dans clientPrincipal ou accessible via un autre endpoint
    // Pour SWA, le token est disponible via l'header X-MS-TOKEN-AAD-ACCESS-TOKEN
    // côté serveur, mais côté client on utilise la config "loginParameters" pour
    // inclure les scopes dans le flux d'auth.

    // Azure SWA expose l'access token via cet endpoint (provider-specific)
    var tokenRes = await fetch('/.auth/me', {
      headers: { 'Accept': 'application/json' }
    });
    var tokenData = await tokenRes.json();

    // Tenter plusieurs emplacements possibles
    var accessToken = null;
    var cp = tokenData && tokenData.clientPrincipal;
    if (cp) {
      // Certaines configs SWA exposent les tokens dans clientPrincipal
      if (cp.accessToken) accessToken = cp.accessToken;
      if (cp.userClaims) {
        // Les claims ne contiennent pas de token, mais peuvent contenir un access_token
        var tok = cp.userClaims.find(function(c) { return c.typ === 'access_token'; });
        if (tok) accessToken = tok.val;
      }
    }

    // Dernier recours : essayer l'ancien format Azure App Service
    if (!accessToken) {
      try {
        var meRes = await fetch('/.auth/me');
        var meArr = await meRes.json();
        // Si le format est un tableau (ancien Azure App Service style)
        if (Array.isArray(meArr) && meArr[0]) {
          accessToken = meArr[0].access_token || (meArr[0].user_claims && meArr[0].user_claims.access_token);
        }
      } catch(e) {}
    }

    if (!accessToken) {
      console.error('[Graph] Aucun access_token trouvé dans /.auth/me');
      console.log('[Graph] Réponse /.auth/me:', tokenData);
      return null;
    }

    // Pas d'info d'expiration dans SWA, on met 50 min par défaut
    _graphToken = {
      token: accessToken,
      exp: Date.now() + 50 * 60 * 1000,
    };
    sessionStorage.setItem('af_graph_token', JSON.stringify(_graphToken));
    console.log('[Graph] Token obtenu via Azure SWA ✓');
    return _graphToken.token;

  } catch(e) {
    console.error('[Graph] Token error:', e.message);
    return null;
  }
}

// ── Appel Graph API générique ────────────────────────────────
async function graphCall(method, url, body) {
  var token = await getGraphToken();
  var headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  var opts = { method: method, headers: headers };
  if (body) opts.body = JSON.stringify(body);
  var res = await fetch('https://graph.microsoft.com/v1.0' + url, opts);
  if (!res.ok) {
    var err = await res.text();
    console.error('[Graph]', method, url, res.status, err);
    // Si 401 : token expiré → invalider le cache pour la prochaine fois
    if (res.status === 401) {
      _graphToken = null;
      sessionStorage.removeItem('af_graph_token');
    }
    throw new Error('Graph API error ' + res.status);
  }
  if (res.status === 204) return null;
  return await res.json();
}

// ── Récupérer l'ID du site SharePoint ───────────────────────
async function getSiteId() {
  if (AUDITFLOW_CONFIG.siteId) return AUDITFLOW_CONFIG.siteId;
  var u = new URL(AUDITFLOW_CONFIG.siteUrl);
  var data = await graphCall('GET', '/sites/' + u.hostname + ':/' + u.pathname.replace(/^\//, ''));
  AUDITFLOW_CONFIG.siteId = data.id;
  return data.id;
}

async function getDriveId() {
  if (AUDITFLOW_CONFIG.driveId) return AUDITFLOW_CONFIG.driveId;
  var siteId = await getSiteId();
  var data = await graphCall('GET', '/sites/' + siteId + '/drive');
  AUDITFLOW_CONFIG.driveId = data.id;
  return data.id;
}

var _listIds = {};
async function getListId(listName) {
  if (_listIds[listName]) return _listIds[listName];
  var siteId = await getSiteId();
  try {
    var data = await graphCall('GET', '/sites/' + siteId + '/lists/' + encodeURIComponent(listName));
    _listIds[listName] = data.id;
    return data.id;
  } catch(e) {
    console.log('[Graph] Création liste:', listName);
    await createList(siteId, listName);
    var data2 = await graphCall('GET', '/sites/' + siteId + '/lists/' + encodeURIComponent(listName));
    _listIds[listName] = data2.id;
    return data2.id;
  }
}

async function createList(siteId, listName) {
  var columns = LIST_SCHEMAS[listName] || [];
  await graphCall('POST', '/sites/' + siteId + '/lists', {
    displayName: listName, columns: columns, list: { template: 'genericList' }
  });
}

var LIST_SCHEMAS = {
  AF_AuditPlan: [
    {name:'af_id',text:{}},{name:'type',text:{}},{name:'titre',text:{}},
    {name:'annee',number:{}},{name:'statut',text:{}},{name:'auditeurs',text:{}},
    {name:'domaine',text:{}},{name:'process',text:{}},{name:'process_id',text:{}},
    {name:'entite',text:{}},{name:'region',text:{}},{name:'pays',text:{}},
    {name:'date_debut',text:{}},{name:'date_fin',text:{}},{name:'step_num',number:{}},
  ],
  AF_Processes: [
    {name:'af_id',text:{}},{name:'dom',text:{}},{name:'proc',text:{}},
    {name:'risk',number:{}},{name:'risk_level',text:{}},{name:'archived',boolean:{}},
    {name:'risks_json',text:{}},{name:'y25_json',text:{}},{name:'y26_json',text:{}},
    {name:'y27_json',text:{}},{name:'y28_json',text:{}},
  ],
  AF_Actions: [
    {name:'af_id',text:{}},{name:'title',text:{}},{name:'audit',text:{}},
    {name:'resp',text:{}},{name:'dept',text:{}},{name:'ent',text:{}},
    {name:'year',number:{}},{name:'quarter',text:{}},{name:'status',text:{}},
    {name:'pct',number:{}},{name:'from_finding',boolean:{}},{name:'finding_title',text:{}},
  ],
  AF_AuditData: [
    {name:'af_id',text:{}},{name:'tasks_json',text:{}},{name:'controls_json',text:{}},
    {name:'findings_json',text:{}},{name:'mgt_resp_json',text:{}},
    {name:'docs_json',text:{}},{name:'notes',text:{}},
    {name:'maturity_json',text:{}},{name:'risk_links_json',text:{}},
    {name:'audit_risks_json',text:{}},
  ],
  AF_History: [{name:'af_type',text:{}},{name:'msg',text:{}},{name:'user_name',text:{}}],
  AF_Users: [
    {name:'af_id',text:{}},{name:'email',text:{}},{name:'name',text:{}},
    {name:'role',text:{}},{name:'initials',text:{}},{name:'status',text:{}},
    {name:'pwd',text:{}},{name:'source',text:{}},
  ],
};

async function listItems(listName, filter) {
  var siteId = await getSiteId();
  var listId = await getListId(listName);
  var url = '/sites/' + siteId + '/lists/' + listId + '/items?expand=fields&$top=999';
  if (filter) url += '&$filter=' + encodeURIComponent(filter);
  var data = await graphCall('GET', url);
  return (data && data.value) || [];
}

async function createItem(listName, fields) {
  var siteId = await getSiteId();
  var listId = await getListId(listName);
  return await graphCall('POST', '/sites/' + siteId + '/lists/' + listId + '/items', { fields: fields });
}

async function updateItem(listName, spItemId, fields) {
  var siteId = await getSiteId();
  var listId = await getListId(listName);
  await graphCall('PATCH', '/sites/' + siteId + '/lists/' + listId + '/items/' + spItemId + '/fields', fields);
}

async function deleteItem(listName, spItemId) {
  var siteId = await getSiteId();
  var listId = await getListId(listName);
  await graphCall('DELETE', '/sites/' + siteId + '/lists/' + listId + '/items/' + spItemId);
}

var _spIdCache = {};
async function findSpItemId(listName, afId) {
  var cacheKey = listName + '::' + afId;
  if (_spIdCache[cacheKey]) return _spIdCache[cacheKey];
  var items = await listItems(listName, "fields/af_id eq '" + afId + "'");
  if (items.length) { _spIdCache[cacheKey] = items[0].id; return items[0].id; }
  return null;
}

async function spUpsert(listName, afId, fields) {
  try {
    var spId = await findSpItemId(listName, afId);
    if (spId) {
      await updateItem(listName, spId, fields);
    } else {
      var created = await createItem(listName, Object.assign({ af_id: afId }, fields));
      _spIdCache[listName + '::' + afId] = created.id;
    }
    console.log('[SP] Saved', listName, afId);
  } catch(e) {
    console.error('[SP] Upsert error', listName, afId, e.message);
    if (typeof toast === 'function') toast('Erreur sauvegarde: ' + e.message);
  }
}

async function spDelete(listName, afId) {
  try {
    var spId = await findSpItemId(listName, afId);
    if (spId) { await deleteItem(listName, spId); delete _spIdCache[listName + '::' + afId]; }
  } catch(e) { console.error('[SP] Delete error', listName, afId, e.message); }
}

// ════════════════════════════════════════════════════════════
//  CHARGEMENT DES DONNÉES
// ════════════════════════════════════════════════════════════
async function loadAllData() {
  try {
    var [usersRaw, planRaw, procRaw, actRaw, histRaw] = await Promise.all([
      listItems('AF_Users'), listItems('AF_AuditPlan'), listItems('AF_Processes'),
      listItems('AF_Actions'), listItems('AF_History'),
    ]);

    DB.users = usersRaw.map(function(r){ var f=r.fields; return {
      id:f.af_id, name:f.name||f.Title, email:f.email, role:f.role||'auditeur',
      initials:f.initials||'', status:f.status||'actif', pwd:f.pwd||'', source:f.source||'local',
    };});

    DB.auditPlan = planRaw.map(function(r){ var f=r.fields; return {
      id:f.af_id, type:f.type, titre:f.titre||f.Title, annee:parseInt(f.annee)||2026,
      statut:f.statut||'Planifié', auditeurs:tryParse(f.auditeurs,[]),
      domaine:f.domaine, process:f.process, processId:f.process_id,
      entite:f.entite, region:f.region, pays:tryParse(f.pays,[]),
      dateDebut:f.date_debut||'', dateFin:f.date_fin||'',
      step:f.step_num!=null&&f.step_num!==undefined?parseInt(f.step_num):undefined,
    };});

    DB.processes = procRaw.map(function(r){ var f=r.fields; return {
      id:f.af_id, dom:f.dom, proc:f.proc||f.Title, risk:parseInt(f.risk)||1,
      riskLevel:f.risk_level||'faible', archived:f.archived||false,
      risks:tryParse(f.risks_json,[]),
      y25:tryParse(f.y25_json,null), y26:tryParse(f.y26_json,null),
      y27:tryParse(f.y27_json,null), y28:tryParse(f.y28_json,null),
    };});

    DB.actions = actRaw.map(function(r){ var f=r.fields; return {
      id:f.af_id, title:f.title||f.Title, audit:f.audit, resp:f.resp, dept:f.dept, ent:f.ent,
      year:parseInt(f.year)||2026, quarter:f.quarter, status:f.status||'Non démarré',
      pct:parseInt(f.pct)||0, fromFinding:f.from_finding||false, findingTitle:f.finding_title||null,
    };});

    DB.history = histRaw.map(function(r){ var f=r.fields; return {
      type:f.af_type, msg:f.msg||f.Title, user:f.user_name,
      date:new Date(r.createdDateTime||Date.now()).toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'}),
    };});

    AUDIT_PLAN=DB.auditPlan; PROCESSES=DB.processes; ACTIONS=DB.actions;
    HISTORY_LOG=DB.history; USERS=DB.users;
    console.log('[SP] Data loaded — audits:',AUDIT_PLAN.length,'processes:',PROCESSES.length,'actions:',ACTIONS.length);
  } catch(e) { console.warn('[SP] loadAllData error:', e.message); }
}

async function loadAuditData(auditId) {
  if (DB.auditData[auditId]) return DB.auditData[auditId];
  try {
    var items = await listItems('AF_AuditData', "fields/af_id eq '" + auditId + "'");
    if (items.length) {
      var f = items[0].fields;
      DB.auditData[auditId] = {
        tasks:tryParse(f.tasks_json,{}), controls:tryParse(f.controls_json,{}),
        findings:tryParse(f.findings_json,[]), mgtResp:tryParse(f.mgt_resp_json,[]),
        docs:tryParse(f.docs_json,[]), notes:f.notes||'',
        maturity:tryParse(f.maturity_json,null), riskLinks:tryParse(f.risk_links_json,{}),
        auditRisks:tryParse(f.audit_risks_json,[]),
      };
    } else {
      DB.auditData[auditId] = {tasks:{},controls:{},findings:[],mgtResp:[],docs:[],notes:'',maturity:null,riskLinks:{},auditRisks:[]};
    }
  } catch(e) {
    console.warn('[SP] loadAuditData error:', e.message);
    DB.auditData[auditId] = {tasks:{},controls:{},findings:[],mgtResp:[],docs:[],notes:'',maturity:null,riskLinks:{},auditRisks:[]};
  }
  AUD_DATA[auditId] = DB.auditData[auditId];
  return DB.auditData[auditId];
}

async function saveAuditData(auditId) {
  var d = AUD_DATA[auditId];
  if (!d) return;
  await spUpsert('AF_AuditData', auditId, {
    tasks_json:JSON.stringify(d.tasks), controls_json:JSON.stringify(d.controls),
    findings_json:JSON.stringify(d.findings), mgt_resp_json:JSON.stringify(d.mgtResp),
    docs_json:JSON.stringify(d.docs), notes:d.notes||'',
    maturity_json:JSON.stringify(d.maturity), risk_links_json:JSON.stringify(d.riskLinks||{}),
    audit_risks_json:JSON.stringify(d.auditRisks||[]), Title:auditId,
  });
}

async function saveAuditPlan(ap) {
  await spUpsert('AF_AuditPlan', ap.id, {
    type:ap.type, titre:ap.titre, annee:ap.annee, statut:ap.statut,
    auditeurs:JSON.stringify(ap.auditeurs), domaine:ap.domaine||'',
    process:ap.process||'', process_id:ap.processId||'', entite:ap.entite||'',
    region:ap.region||'', pays:JSON.stringify(ap.pays||[]),
    date_debut:ap.dateDebut||'', date_fin:ap.dateFin||'',
    step_num:ap.step!==undefined?ap.step:null, Title:ap.titre,
  });
}

async function saveAction(ac) {
  await spUpsert('AF_Actions', ac.id, {
    title:ac.title, audit:ac.audit, resp:ac.resp, dept:ac.dept, ent:ac.ent,
    year:ac.year, quarter:ac.quarter, status:ac.status, pct:ac.pct,
    from_finding:ac.fromFinding||false, finding_title:ac.findingTitle||'', Title:ac.title,
  });
}

async function addHistoryDB(type, msg, userName) {
  try {
    var siteId = await getSiteId();
    var listId = await getListId('AF_History');
    await graphCall('POST', '/sites/'+siteId+'/lists/'+listId+'/items',
      {fields:{af_type:type,msg:msg,user_name:userName,Title:msg.slice(0,100)}});
  } catch(e) { console.warn('[SP] History error:', e.message); }
}

async function saveUser(user) {
  await spUpsert('AF_Users', user.id, {
    email:user.email, name:user.name, role:user.role, initials:user.initials||'',
    status:user.status||'actif', pwd:user.pwd||'', source:user.source||'local', Title:user.name,
  });
}

async function uploadDoc(auditId, file, stepIndex, userName) {
  var ap = AUDIT_PLAN.find(function(a){ return a.id===auditId; });
  var folderName = ap ? ap.titre.replace(/[^a-zA-Z0-9 _-]/g,'_') : auditId;
  var driveId = await getDriveId();
  var uploadPath = '/drives/'+driveId+'/root:/AuditFlow/'+folderName+'/'+file.name+':/content';
  var token = await getGraphToken();
  var res = await fetch('https://graph.microsoft.com/v1.0'+uploadPath, {
    method:'PUT',
    headers:{'Authorization':'Bearer '+token,'Content-Type':file.type||'application/octet-stream'},
    body:file,
  });
  if (!res.ok) throw new Error('Upload failed: '+res.status);
  var data = await res.json();
  var sizeTxt = file.size<1024*1024 ? Math.round(file.size/1024)+' Ko' : (file.size/1024/1024).toFixed(1)+' Mo';
  var docObj = {
    name:file.name, size:sizeTxt, url:data.webUrl, driveId:driveId, itemId:data.id,
    uploadedBy:userName||'Inconnu', uploadedAt:new Date().toISOString(),
    step:stepIndex!==undefined?stepIndex:null,
  };
  var d = getAudData(auditId);
  d.docs.push(docObj);
  await saveAuditData(auditId);
  return docObj;
}

async function deleteDoc(auditId, itemId, name) {
  if (!confirm('Supprimer "'+name+'" ?')) return;
  try {
    var driveId = await getDriveId();
    await graphCall('DELETE', '/drives/'+driveId+'/items/'+itemId);
  } catch(e) { console.warn('[SP] Delete doc error:', e.message); }
  var d = getAudData(auditId);
  d.docs = d.docs.filter(function(f){ return f.itemId!==itemId; });
  await saveAuditData(auditId);
  document.getElementById('det-content').innerHTML = renderDetContent();
  toast(name+' supprimé ✓');
}

async function renameDocInDB(auditId, docIndex, newName) {
  var d = getAudData(auditId);
  if (!d.docs[docIndex]) return;
  d.docs[docIndex].name = newName;
  await saveAuditData(auditId);
}

async function replaceDocInDB(auditId, docIndex, file, stepIndex, userName) {
  var d = getAudData(auditId);
  var oldDoc = d.docs[docIndex];
  if (!oldDoc) return null;
  if (oldDoc.itemId) {
    try { var driveId = await getDriveId(); await graphCall('DELETE','/drives/'+driveId+'/items/'+oldDoc.itemId); } catch(e) {}
  }
  d.docs.splice(docIndex,1);
  return await uploadDoc(auditId, file, stepIndex, userName);
}

function tryParse(str, fallback) {
  if (!str) return fallback;
  if (typeof str==='object') return str;
  try { return JSON.parse(str); } catch(e) { return fallback; }
}

async function loadAuthorizedUsers() {
  try {
    var items = await listItems('AF_Users');
    return items.map(function(r){ var f=r.fields; return {
      id:f.af_id||f.email, name:f.name||f.Title, email:f.email, role:f.role||'viewer',
      initials:f.initials||'', status:f.status||'actif', pwd:f.pwd||'', source:f.source||'sso',
    };});
  } catch(e) { console.warn('[SP] loadAuthorizedUsers error:', e.message); return USERS; }
}

async function inviteUser(email, name, role) {
  var id = 'usr_'+Date.now();
  var initials = name.split(' ').map(function(w){return w[0];}).join('').toUpperCase().slice(0,2);
  var user = {id:id,name:name,email:email,role:role,initials:initials,status:'actif',source:'invited',pwd:''};
  await saveUser(user);
  USERS.push(user);
  return user;
}

async function revokeUser(userId) {
  await spDelete('AF_Users', userId);
  USERS = USERS.filter(function(u){ return u.id!==userId; });
}
