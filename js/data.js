// ============================================================
// AUDITFLOW — DONNÉES
// Charge depuis SharePoint si connecté, sinon données locales
// ============================================================

const STEPS = [
  { l: 'Scope &\nPrep',       s: 'Scope & Preparation',   ph: 1 },
  { l: 'Work\nProgram',       s: 'Work Program',           ph: 1 },
  { l: 'Kick\nOff',           s: 'Audit Kick Off',         ph: 1 },
  { l: 'Interviews',          s: 'Interviews / Process Review', ph: 2 },
  { l: 'Flowcharts\n& Tests', s: 'Flowcharts/Testing Strategy', ph: 2 },
  { l: 'Testings',            s: 'Testings',               ph: 2 },
  { l: 'Report',              s: 'Report',                 ph: 3 },
  { l: 'Restitution',         s: 'Report Restitution',     ph: 3 },
  { l: 'Mgmt\nResp.',         s: 'Management Responses',   ph: 3 },
  { l: 'ExCo\nReport',        s: 'Exec. Committee Report', ph: 3 },
  { l: 'AC\nReport',          s: 'Audit Committee Report', ph: 3 },
];

const MONTHS = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc'];

const CHECKLISTS = {
  'Scope & Preparation': [
    'Définir le périmètre de la mission',
    'Identifier les processus à auditer',
    'Rédiger la lettre de mission',
    'Valider le budget et les ressources',
    'Prendre contact avec l\'audité',
  ],
  'Work Program': [
    'Identifier les objectifs de contrôle',
    'Définir les procédures d\'audit',
    'Documenter les risques clés',
    'Préparer les programmes de travail',
    'Valider le programme avec Philippe',
  ],
  'Audit Kick Off': [
    'Préparer le support de présentation',
    'Présenter l\'équipe d\'audit',
    'Expliquer les objectifs et le périmètre',
    'Planifier les interviews',
    'Valider le calendrier avec l\'audité',
  ],
  'Interviews / Process Review': [
    'Préparer le guide d\'interview',
    'Conduire les entretiens',
    'Documenter les réponses',
    'Analyser les process existants',
    'Identifier les zones de risque',
    'Formaliser les notes d\'interview',
  ],
  'Flowcharts/Testing Strategy': [
    'Documenter les flux de processus',
    'Identifier les points de contrôle',
    'Définir la stratégie de test',
    'Valider les flowcharts avec l\'audité',
    'Préparer la matrice de test',
  ],
  'Testings': [
    'Définir la population et l\'échantillon',
    'Exécuter les tests prévus',
    'Documenter les exceptions',
    'Analyser les résultats',
    'Formuler les constats',
    'Rédiger les conclusions de test',
  ],
  'Report': [
    'Structurer le rapport',
    'Rédiger les constats et recommandations',
    'Faire relire en interne',
    'Envoyer le projet de rapport à l\'audité',
    'Intégrer les premiers retours',
  ],
  'Report Restitution': [
    'Préparer la présentation de restitution',
    'Organiser la réunion avec l\'audité',
    'Présenter les constats',
    'Recueillir les réactions',
    'Documenter les échanges',
  ],
  'Management Responses': [
    'Envoyer le rapport à l\'audité',
    'Collecter les réponses du management',
    'Intégrer les plans d\'action',
    'Finaliser le rapport',
    'Valider les engagements',
  ],
  'Exec. Committee Report': [
    'Préparer la synthèse ExCo',
    'Adapter le format (1 page)',
    'Présenter au Comité Exécutif',
    'Documenter les décisions',
    'Archiver le compte-rendu',
  ],
  'Audit Committee Report': [
    'Préparer la synthèse Audit Committee',
    'Formaliser les points d\'attention',
    'Présenter au Comité d\'Audit',
    'Recueillir les observations',
    'Clôturer officiellement la mission',
  ],
};

const LOCAL_AUDITS = [
  { id:'a1', name:'Product Development', type:'Process', ent:'74S',    resp:'Selma H.',   start:0, dur:6, status:'Exécution',  step:2, assignedTo:['sh'] },
  { id:'a2', name:'Product Deployment',  type:'Process', ent:'74S',    resp:'Nisrine E.', start:2, dur:5, status:'Revue',      step:3, assignedTo:['ne'] },
  { id:'a3', name:'Budget / Forecast',   type:'Process', ent:'Groupe', resp:'Selma H.',   start:7, dur:3, status:'Préparation',step:0, assignedTo:['sh'] },
  { id:'a4', name:'Product Quality',     type:'Process', ent:'74S',    resp:'Nisrine E.', start:1, dur:7, status:'Exécution',  step:2, assignedTo:['ne'] },
  { id:'a5', name:'BU Maroc/Afrique',    type:'BU',      ent:'SBS',    resp:'Selma H.',   start:0, dur:4, status:'Clôturé',   step:10, assignedTo:['sh'] },
  { id:'a6', name:'BU Lebanon',          type:'BU',      ent:'SBS',    resp:'Nisrine E.', start:3, dur:3, status:'Exécution',  step:2, assignedTo:['ne'] },
  { id:'a7', name:'BU UK SBS',           type:'BU',      ent:'SBS',    resp:'Selma H.',   start:5, dur:4, status:'Préparation',step:0, assignedTo:['sh','ne'] },
];

const LOCAL_PROCESSES = [
  { id:'p1',  dom:'Governance',         proc:'Acquisitions',                  risk:3, archived:false, y25:null,                         y26:{l:'SBS Integration',e:'sbs'}, y27:{l:'Product Strat.',e:'both'}, y28:null },
  { id:'p2',  dom:'Governance',         proc:'External Factors / Sustainability', risk:1, archived:false, y25:null, y26:null, y27:null, y28:{l:'ESG / Business Continuity',e:'grp'} },
  { id:'p3',  dom:'Governance',         proc:'Compliance',                    risk:1, archived:false, y25:null, y26:null, y27:null, y28:{l:'Compliance / IP',e:'grp'} },
  { id:'p4',  dom:'Edition',            proc:'Products & Portfolio',           risk:2, archived:false, y25:null, y26:null, y27:{l:'Product Strat.',e:'both'}, y28:null },
  { id:'p5',  dom:'Edition',            proc:'Product Development',            risk:2, archived:false, y25:{l:'Product Devt',e:'74s'}, y26:{l:'E2E Cross PL',e:'74s'}, y27:{l:'Product Devt',e:'74s'}, y28:{l:'Research Tax Credit',e:'grp'} },
  { id:'p6',  dom:'Deployment',         proc:'Product Deployment',             risk:2, archived:false, y25:{l:'Product Deployment',e:'74s'}, y26:null, y27:{l:'Product Deployment',e:'74s'}, y28:null },
  { id:'p7',  dom:'Deployment',         proc:'Product Quality & Support',      risk:2, archived:false, y25:{l:'Support',e:'74s'}, y26:null, y27:{l:'Support',e:'74s'}, y28:null },
  { id:'p8',  dom:'Distribution',       proc:'Marketing / Brand',              risk:1, archived:false, y25:null, y26:{l:'Corp Marketing',e:'grp'}, y27:null, y28:{l:'Corp Marketing',e:'grp'} },
  { id:'p9',  dom:'Distribution',       proc:'Enablement',                     risk:1, archived:false, y25:null, y26:{l:'Enablement',e:'74s'}, y27:null, y28:{l:'Enablement',e:'74s'} },
  { id:'p10', dom:'Distribution',       proc:'Go-to-Market',                   risk:1, archived:false, y25:null, y26:{l:'GTM',e:'74s'}, y27:null, y28:{l:'GTM',e:'74s'} },
  { id:'p11', dom:'Distribution',       proc:'Sales & Services',               risk:1, archived:false, y25:null, y26:null, y27:{l:'Sales',e:'both'}, y28:null },
  { id:'p12', dom:'Distribution',       proc:'Customer Experience',            risk:2, archived:false, y25:null, y26:{l:'Customer Success',e:'74s'}, y27:null, y28:null },
  { id:'p13', dom:'Distribution',       proc:'Subscription & Renewal',         risk:2, archived:false, y25:null, y26:{l:'Renewals',e:'both'}, y27:null, y28:null },
  { id:'p14', dom:'Support Functions',  proc:'OTC',                            risk:1, archived:false, y25:null, y26:null, y27:null, y28:{l:'OTC',e:'grp'} },
  { id:'p15', dom:'Support Functions',  proc:'Treasury & Tax',                 risk:1, archived:false, y25:null, y26:{l:'Cash',e:'grp'}, y27:null, y28:{l:'Research Tax Credit',e:'grp'} },
  { id:'p16', dom:'Support Functions',  proc:'Accounting & Reporting',         risk:1, archived:false, y25:null, y26:null, y27:null, y28:{l:'RtR',e:'grp'} },
  { id:'p17', dom:'Support Functions',  proc:'Budget / Forecast',              risk:1, archived:false, y25:{l:'Budget/Fcst',e:'grp'}, y26:null, y27:null, y28:null },
  { id:'p18', dom:'Support Functions',  proc:'Purchasing & Third Party',       risk:1, archived:false, y25:null, y26:null, y27:{l:'P2P / 3rd Party',e:'grp'}, y28:null },
  { id:'p19', dom:'Support Functions',  proc:'Talent Management',              risk:2, archived:false, y25:null, y26:null, y27:{l:'Payroll & Careers',e:'grp'}, y28:null },
  { id:'p20', dom:'Support Functions',  proc:'Payroll & Benefits',             risk:2, archived:false, y25:null, y26:null, y27:null, y28:null },
  { id:'p21', dom:'Support Functions',  proc:'Cybersecurity & Data Mgt',       risk:3, archived:false, y25:null, y26:null, y27:{l:'Cybersecurity',e:'grp'}, y28:null },
  { id:'p22', dom:'Support Functions',  proc:'Systems & Applications',         risk:3, archived:false, y25:null, y26:null, y27:null, y28:null },
  { id:'p23', dom:'Support Functions',  proc:'Infrastructures',                risk:3, archived:false, y25:null, y26:null, y27:null, y28:{l:'IT Assets (CMDB)',e:'grp'} },
];

const LOCAL_ACTIONS = [
  { id:'ac1', title:'Contrôles d\'accès SI',          audit:'Cybersecurity', resp:'Nisrine E.', ent:'Groupe', due:'15 oct. 2025', status:'En retard',    pct:30 },
  { id:'ac2', title:'Séparation des tâches OTC',      audit:'OTC',           resp:'Selma H.',   ent:'Groupe', due:'30 oct. 2025', status:'En retard',    pct:10 },
  { id:'ac3', title:'Mise à jour procédure achats',   audit:'P2P',           resp:'Nisrine E.', ent:'Groupe', due:'15 nov. 2025', status:'En cours',     pct:60 },
  { id:'ac4', title:'Revue des habilitations ERP',    audit:'Systems',       resp:'Selma H.',   ent:'74S',    due:'30 nov. 2025', status:'En cours',     pct:45 },
  { id:'ac5', title:'Plan de continuité SI',          audit:'Infrastructures',resp:'Nisrine E.',ent:'Groupe', due:'31 déc. 2025', status:'Non démarré',  pct:0  },
  { id:'ac6', title:'Formalisation politique RH',     audit:'Talent',        resp:'Selma H.',   ent:'Groupe', due:'28 fév. 2026', status:'En cours',     pct:70 },
  { id:'ac7', title:'Rapprochement bancaire mensuel', audit:'Treasury',      resp:'Nisrine E.', ent:'Groupe', due:'30 sept. 2025',status:'En retard',    pct:20 },
];

// State global de l'application
const STATE = {
  audits:    [...LOCAL_AUDITS],
  processes: [...LOCAL_PROCESSES],
  buPlan:    [],
  actions:   [...LOCAL_ACTIONS],
  history:   [],
  tasks:     {},      // { auditId: [tasks] }
  user:      null,
  sp:        null,    // SharePointService instance
  connected: false,   // true si connecté à SharePoint
};

// Utilitaires
const BADGE = {
  status: {
    'Préparation': 'badge-prep',
    'Exécution':   'badge-exec',
    'Revue':       'badge-review',
    'Clôturé':     'badge-done',
    'Planifié':    'badge-planned',
    'Restitution': 'badge-review',
    'En retard':   'badge-late',
    'En cours':    'badge-exec',
    'Non démarré': 'badge-planned',
  },
  ent: {
    'SBS': 'badge-sbs', 'AXWAY': 'badge-axw',
    '74S': 'badge-74s', 'Groupe': 'badge-grp',
  },
  pri: { High:'badge-high', Mid:'badge-mid', Low:'badge-low' },
  type: { Process:'badge-process', BU:'badge-bu' },
};

const PRCT = {
  'Préparation':10, 'Exécution':50, 'Revue':80,
  'Clôturé':100, 'Planifié':0, 'Restitution':90,
};

const GANTT_COLORS = [
  '#AFA9EC','#85B7EB','#5DCAA5','#EF9F27',
  '#F0997B','#97C459','#AFA9EC','#85B7EB',
  '#5DCAA5','#EF9F27',
];

const RS = { 1:'<span style="color:#3B6D11">★</span>', 2:'<span style="color:#854F0B">★★</span>', 3:'<span style="color:#A32D2D">★★★</span>' };
const ENT_TAG = {
  sbs:  '<span class="badge badge-sbs">SBS</span>',
  axw:  '<span class="badge badge-axw">AXWAY</span>',
  '74s':'<span class="badge badge-74s">74S</span>',
  both: '<span class="badge" style="background:#FAEEDA;color:#633806">SBS/AXW</span>',
  grp:  '<span class="badge badge-grp">Groupe</span>',
};

function badge(status) {
  return `<span class="badge ${BADGE.status[status]||'badge-planned'}">${status}</span>`;
}
function pbar(status) {
  return `<div class="pbar"><div class="pfill" style="width:${PRCT[status]||0}%"></div></div>`;
}

// Tâches par défaut pour chaque étape
function defaultTasks(auditId, assignedTo) {
  const a1 = assignedTo[0] || 'sh';
  const a2 = assignedTo[1] || assignedTo[0] || 'sh';
  return STEPS.map((s, si) => {
    const items = CHECKLISTS[s.s] || [];
    return items.map((desc, i) => ({
      id: `${auditId}_${si}_${i}`,
      auditId, stepIndex: si,
      desc, done: si < 2 || (si === 2 && i < 1),
      assignee: i % 2 === 0 ? a1 : a2,
    }));
  });
}

// Membres de l'équipe
const TEAM_MEMBERS = {
  pm: { id:'pm', name:'Philippe M.', short:'PM', role:'admin',    avClass:'av-pm' },
  sh: { id:'sh', name:'Selma H.',    short:'SH', role:'auditeur', avClass:'av-sh' },
  ne: { id:'ne', name:'Nisrine E.',  short:'NE', role:'auditeur', avClass:'av-ne' },
};

// Couleurs avatars
const AV_STYLES = {
  pm: 'background:#CECBF6;color:#3C3489',
  sh: 'background:#9FE1CB;color:#085041',
  ne: 'background:#B5D4F4;color:#0C447C',
};
