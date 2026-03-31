// ============================================================
// AUDITFLOW — COUCHE DONNÉES SHAREPOINT
// Gère toutes les lectures / écritures via Microsoft Graph
// ============================================================

class SharePointService {

  constructor(accessToken, config) {
    this.token = accessToken;
    this.config = config;
    this.baseUrl = `https://graph.microsoft.com/v1.0`;
    this.siteId = null;
  }

  // Headers communs pour toutes les requêtes Graph
  get headers() {
    return {
      "Authorization": `Bearer ${this.token}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
    };
  }

  // Récupère l'ID du site SharePoint
  async getSiteId() {
    if (this.siteId) return this.siteId;
    const url = new URL(this.config.sharePointUrl);
    const hostname = url.hostname;
    const path = url.pathname;
    const res = await fetch(
      `${this.baseUrl}/sites/${hostname}:${path}`,
      { headers: this.headers }
    );
    const data = await res.json();
    this.siteId = data.id;
    return this.siteId;
  }

  // Initialise les listes SharePoint si elles n'existent pas
  async initLists() {
    const siteId = await this.getSiteId();
    const listDefs = [
      { name: this.config.lists.audits,    columns: ["Title","Type","Entite","Responsable","Statut","Etape","StartMonth","Duration","AssignedTo"] },
      { name: this.config.lists.tasks,     columns: ["Title","AuditId","StepIndex","Assignee","Done","Description"] },
      { name: this.config.lists.processes, columns: ["Title","Domaine","Risk","Y25","Y26","Y27","Y28","Archived"] },
      { name: this.config.lists.buPlan,    columns: ["Title","Entite","Region","Pays","RiskNote","Employes","Priority","TypeAudit","Y25","Y26","Y27","Y28","Archived"] },
      { name: this.config.lists.actions,   columns: ["Title","AuditRef","Responsable","Entite","Echeance","Statut","Pct"] },
      { name: this.config.lists.history,   columns: ["Title","ActionType","Message","UserName","ActionDate"] },
    ];

    for (const def of listDefs) {
      try {
        await fetch(`${this.baseUrl}/sites/${siteId}/lists`, {
          method: "POST",
          headers: this.headers,
          body: JSON.stringify({
            displayName: def.name,
            list: { template: "genericList" },
          }),
        });
      } catch(e) {
        // Liste déjà existante, on continue
      }
    }
  }

  // --- AUDITS ---

  async getAudits() {
    const siteId = await this.getSiteId();
    const res = await fetch(
      `${this.baseUrl}/sites/${siteId}/lists/${this.config.lists.audits}/items?expand=fields`,
      { headers: this.headers }
    );
    const data = await res.json();
    return (data.value || []).map(item => ({
      id: item.id,
      name: item.fields.Title,
      type: item.fields.Type,
      ent: item.fields.Entite,
      resp: item.fields.Responsable,
      status: item.fields.Statut,
      step: parseInt(item.fields.Etape || "0"),
      start: parseInt(item.fields.StartMonth || "0"),
      dur: parseInt(item.fields.Duration || "3"),
      assignedTo: (item.fields.AssignedTo || "").split(",").filter(Boolean),
    }));
  }

  async createAudit(audit) {
    const siteId = await this.getSiteId();
    const res = await fetch(
      `${this.baseUrl}/sites/${siteId}/lists/${this.config.lists.audits}/items`,
      {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({
          fields: {
            Title: audit.name,
            Type: audit.type,
            Entite: audit.ent,
            Responsable: audit.resp,
            Statut: "Planifié",
            Etape: "0",
            StartMonth: String(audit.start),
            Duration: String(audit.dur),
            AssignedTo: (audit.assignedTo || []).join(","),
          }
        }),
      }
    );
    return await res.json();
  }

  async updateAudit(id, fields) {
    const siteId = await this.getSiteId();
    await fetch(
      `${this.baseUrl}/sites/${siteId}/lists/${this.config.lists.audits}/items/${id}`,
      {
        method: "PATCH",
        headers: this.headers,
        body: JSON.stringify({ fields }),
      }
    );
  }

  // --- TÂCHES ---

  async getTasks(auditId) {
    const siteId = await this.getSiteId();
    const res = await fetch(
      `${this.baseUrl}/sites/${siteId}/lists/${this.config.lists.tasks}/items?expand=fields&$filter=fields/AuditId eq '${auditId}'`,
      { headers: this.headers }
    );
    const data = await res.json();
    return (data.value || []).map(item => ({
      id: item.id,
      auditId: item.fields.AuditId,
      stepIndex: parseInt(item.fields.StepIndex || "0"),
      desc: item.fields.Description || item.fields.Title,
      assignee: item.fields.Assignee || "none",
      done: item.fields.Done === "true" || item.fields.Done === true,
    }));
  }

  async createTask(task) {
    const siteId = await this.getSiteId();
    return await fetch(
      `${this.baseUrl}/sites/${siteId}/lists/${this.config.lists.tasks}/items`,
      {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({
          fields: {
            Title: task.desc,
            AuditId: task.auditId,
            StepIndex: String(task.stepIndex),
            Description: task.desc,
            Assignee: task.assignee || "none",
            Done: "false",
          }
        }),
      }
    );
  }

  async updateTask(id, fields) {
    const siteId = await this.getSiteId();
    await fetch(
      `${this.baseUrl}/sites/${siteId}/lists/${this.config.lists.tasks}/items/${id}`,
      {
        method: "PATCH",
        headers: this.headers,
        body: JSON.stringify({ fields }),
      }
    );
  }

  // --- PLAN PROCESS ---

  async getProcesses() {
    const siteId = await this.getSiteId();
    const res = await fetch(
      `${this.baseUrl}/sites/${siteId}/lists/${this.config.lists.processes}/items?expand=fields`,
      { headers: this.headers }
    );
    const data = await res.json();
    return (data.value || []).map(item => ({
      id: item.id,
      proc: item.fields.Title,
      dom: item.fields.Domaine,
      risk: parseInt(item.fields.Risk || "1"),
      y25: item.fields.Y25 ? JSON.parse(item.fields.Y25) : null,
      y26: item.fields.Y26 ? JSON.parse(item.fields.Y26) : null,
      y27: item.fields.Y27 ? JSON.parse(item.fields.Y27) : null,
      y28: item.fields.Y28 ? JSON.parse(item.fields.Y28) : null,
      archived: item.fields.Archived === "true",
    }));
  }

  async updateProcess(id, fields) {
    const siteId = await this.getSiteId();
    await fetch(
      `${this.baseUrl}/sites/${siteId}/lists/${this.config.lists.processes}/items/${id}`,
      {
        method: "PATCH",
        headers: this.headers,
        body: JSON.stringify({ fields }),
      }
    );
  }

  // --- PLAN BU ---

  async getBUPlan() {
    const siteId = await this.getSiteId();
    const res = await fetch(
      `${this.baseUrl}/sites/${siteId}/lists/${this.config.lists.buPlan}/items?expand=fields`,
      { headers: this.headers }
    );
    const data = await res.json();
    return (data.value || []).map(item => ({
      id: item.id,
      pays: item.fields.Title,
      ent: item.fields.Entite,
      reg: item.fields.Region,
      risk: item.fields.RiskNote,
      emp: parseInt(item.fields.Employes || "0") || null,
      pri: item.fields.Priority,
      type: item.fields.TypeAudit,
      y25: item.fields.Y25 || null,
      y26: item.fields.Y26 || null,
      y27: item.fields.Y27 || null,
      y28: item.fields.Y28 || null,
      archived: item.fields.Archived === "true",
    }));
  }

  async updateBU(id, fields) {
    const siteId = await this.getSiteId();
    await fetch(
      `${this.baseUrl}/sites/${siteId}/lists/${this.config.lists.buPlan}/items/${id}`,
      {
        method: "PATCH",
        headers: this.headers,
        body: JSON.stringify({ fields }),
      }
    );
  }

  // --- PLANS D'ACTION ---

  async getActions() {
    const siteId = await this.getSiteId();
    const res = await fetch(
      `${this.baseUrl}/sites/${siteId}/lists/${this.config.lists.actions}/items?expand=fields`,
      { headers: this.headers }
    );
    const data = await res.json();
    return (data.value || []).map(item => ({
      id: item.id,
      title: item.fields.Title,
      audit: item.fields.AuditRef,
      resp: item.fields.Responsable,
      ent: item.fields.Entite,
      due: item.fields.Echeance,
      status: item.fields.Statut,
      pct: parseInt(item.fields.Pct || "0"),
    }));
  }

  async createAction(action) {
    const siteId = await this.getSiteId();
    await fetch(
      `${this.baseUrl}/sites/${siteId}/lists/${this.config.lists.actions}/items`,
      {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({
          fields: {
            Title: action.title,
            AuditRef: action.audit,
            Responsable: action.resp,
            Entite: action.ent,
            Echeance: action.due,
            Statut: "Non démarré",
            Pct: "0",
          }
        }),
      }
    );
  }

  // --- HISTORIQUE ---

  async addHistory(type, message, userName) {
    const siteId = await this.getSiteId();
    await fetch(
      `${this.baseUrl}/sites/${siteId}/lists/${this.config.lists.history}/items`,
      {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({
          fields: {
            Title: message.substring(0, 255),
            ActionType: type,
            Message: message,
            UserName: userName,
            ActionDate: new Date().toISOString(),
          }
        }),
      }
    );
  }

  async getHistory() {
    const siteId = await this.getSiteId();
    const res = await fetch(
      `${this.baseUrl}/sites/${siteId}/lists/${this.config.lists.history}/items?expand=fields&$orderby=fields/ActionDate desc&$top=50`,
      { headers: this.headers }
    );
    const data = await res.json();
    return (data.value || []).map(item => ({
      id: item.id,
      type: item.fields.ActionType,
      msg: item.fields.Message,
      user: item.fields.UserName,
      date: new Date(item.fields.ActionDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }),
    }));
  }

  // --- UPLOAD DOCUMENTS ---

  async uploadDocument(auditId, file) {
    const siteId = await this.getSiteId();
    const folder = `AuditFlow/Audits/${auditId}`;
    const res = await fetch(
      `${this.baseUrl}/sites/${siteId}/drive/root:/${folder}/${file.name}:/content`,
      {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${this.token}`,
          "Content-Type": file.type || "application/octet-stream",
        },
        body: file,
      }
    );
    return await res.json();
  }

  async getDocuments(auditId) {
    const siteId = await this.getSiteId();
    const folder = `AuditFlow/Audits/${auditId}`;
    try {
      const res = await fetch(
        `${this.baseUrl}/sites/${siteId}/drive/root:/${folder}:/children`,
        { headers: this.headers }
      );
      const data = await res.json();
      return (data.value || []).map(f => ({
        name: f.name,
        size: this._formatSize(f.size),
        url: f.webUrl,
        modified: new Date(f.lastModifiedDateTime).toLocaleDateString("fr-FR"),
      }));
    } catch(e) {
      return [];
    }
  }

  _formatSize(bytes) {
    if (!bytes) return "—";
    if (bytes < 1024) return bytes + " o";
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " Ko";
    return (bytes / (1024 * 1024)).toFixed(1) + " Mo";
  }
}
