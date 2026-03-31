// ============================================================
// AUDITFLOW — CONFIGURATION
// ============================================================
// Remplissez les 3 valeurs ci-dessous avec les informations
// fournies par votre IT, puis déposez tous les fichiers
// sur votre SharePoint. C'est tout !
// ============================================================

const AUDITFLOW_CONFIG = {

  // 1. Fourni par votre IT après l'enregistrement Azure AD
  clientId: "VOTRE_CLIENT_ID_ICI",

  // 2. Fourni par votre IT après l'enregistrement Azure AD
  tenantId: "VOTRE_TENANT_ID_ICI",

  // 3. URL de votre site SharePoint Audit Interne
  //    Exemple : "https://votregroupe.sharepoint.com/sites/AuditInterne"
  sharePointUrl: "VOTRE_URL_SHAREPOINT_ICI",

  // Ne pas modifier — noms des listes SharePoint créées automatiquement
  lists: {
    audits:    "AF_Audits",
    tasks:     "AF_Tasks",
    processes: "AF_Processes",
    buPlan:    "AF_BUPlan",
    actions:   "AF_Actions",
    history:   "AF_History",
  },

  // Membres de l'équipe — à mettre à jour si l'équipe évolue
  team: [
    { id: "pm", name: "Philippe M.", email: "philippe.m@groupe.com", role: "admin" },
    { id: "sh", name: "Selma H.",    email: "selma.h@groupe.com",    role: "auditeur" },
    { id: "ne", name: "Nisrine E.",  email: "nisrine.e@groupe.com",  role: "auditeur" },
  ],

  // Version de l'application
  version: "1.0.0",
};
