// ════════════════════════════════════════════════════════════════════════════
//  ai.js — Intégration IA pour AuditFlow
//
//  Appelle l'Azure Function /api/ai pour :
//   1. aiReformulateFinding(rawText, context) — reformule des notes en finding
//   2. aiSuggestControls(processName, context) — suggère 8 contrôles
//
//  Aucune clé API côté client : tout passe par le proxy Azure Function qui
//  injecte la clé Azure OpenAI depuis les Application Settings.
// ════════════════════════════════════════════════════════════════════════════

const AI_API_URL = '/api/ai';

// ════════════════════════════════════════════════════════════════════════════
//  Appel générique
// ════════════════════════════════════════════════════════════════════════════

async function aiCall(action, payload) {
  try {
    const res = await fetch(AI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload })
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`[AI] ${action} HTTP ${res.status}:`, err);
      throw new Error(`Erreur IA (${res.status}). Vérifier la configuration Azure OpenAI.`);
    }

    const data = await res.json();
    return data;
  } catch (e) {
    console.error('[AI] Exception:', e);
    throw e;
  }
}

// ════════════════════════════════════════════════════════════════════════════
//  Cas 1 — Reformulation de finding
// ════════════════════════════════════════════════════════════════════════════

async function aiReformulateFinding(rawText, context) {
  if (!rawText || rawText.trim().length < 10) {
    if (typeof toast === 'function') toast('Texte trop court pour reformulation');
    return null;
  }
  const result = await aiCall('reformulateFinding', { rawText, context });
  return result.content;
}

// Bouton "✨ Reformuler avec IA" — à brancher sur la modale de finding
async function aiReformulateClick(textareaId, btnId) {
  const ta = document.getElementById(textareaId);
  const btn = document.getElementById(btnId);
  if (!ta) return;

  const raw = ta.value.trim();
  if (raw.length < 10) {
    if (typeof toast === 'function') toast('Saisis au moins 10 caractères avant de reformuler');
    return;
  }

  // UI : disabled + spinner
  if (btn) {
    btn.disabled = true;
    btn.dataset.origText = btn.textContent;
    btn.textContent = '⏳ Reformulation...';
  }
  ta.disabled = true;

  try {
    // Récupérer le contexte de l'audit courant si disponible
    let ctx = null;
    if (typeof CA !== 'undefined' && CA && typeof AUDIT_PLAN !== 'undefined') {
      const ap = AUDIT_PLAN.find(a => a.id === CA);
      if (ap) {
        const proc = (typeof PROCESSES !== 'undefined' ? PROCESSES : []).find(p => p.id === ap.processId);
        ctx = {
          process: proc ? proc.proc : ap.titre,
          entity: ap.entite || '',
        };
      }
    }

    const reformulated = await aiReformulateFinding(raw, ctx);
    if (reformulated) {
      // Sauvegarder l'original au cas où
      if (!ta.dataset.originalText) ta.dataset.originalText = raw;
      ta.value = reformulated;
      if (typeof toast === 'function') toast('Finding reformulé ✓');
    }
  } catch (e) {
    if (typeof toast === 'function') toast('Erreur reformulation : ' + e.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = btn.dataset.origText || '✨ Reformuler avec IA';
    }
    ta.disabled = false;
  }
}

// ════════════════════════════════════════════════════════════════════════════
//  Cas 2 — Suggestion de contrôles
// ════════════════════════════════════════════════════════════════════════════

async function aiSuggestControls(processName, context) {
  if (!processName) return null;
  const result = await aiCall('suggestControls', { processName, context });
  // Le modèle est censé retourner du JSON strict
  let parsed;
  try {
    // Nettoyer d'éventuels backticks markdown
    const cleaned = result.content.replace(/^```json\s*|\s*```$/g, '').trim();
    parsed = JSON.parse(cleaned);
  } catch (e) {
    console.error('[AI] JSON parse error:', e, result.content);
    throw new Error('La réponse IA n\'est pas un JSON valide. Réessaye.');
  }
  if (!parsed.controls || !Array.isArray(parsed.controls)) {
    throw new Error('Format de réponse inattendu : pas de champ "controls"');
  }
  return parsed.controls;
}

// Bouton "🤖 Suggérer 8 contrôles avec IA" — à brancher dans la modale Bibliothèque
// Affiche les contrôles suggérés dans une modale dédiée pour validation
async function aiSuggestControlsClick(auditId) {
  if (typeof CONTROLS_LIBRARY === 'undefined') return;

  const ap = (typeof AUDIT_PLAN !== 'undefined' ? AUDIT_PLAN : []).find(a => a.id === auditId);
  if (!ap) {
    if (typeof toast === 'function') toast('Audit introuvable');
    return;
  }
  const proc = (typeof PROCESSES !== 'undefined' ? PROCESSES : []).find(p => p.id === ap.processId);
  const procName = proc ? proc.proc : ap.titre;

  // Modale d'attente
  const ov = document.createElement('div');
  ov.id = 'ai-ov';
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1001;display:flex;align-items:center;justify-content:center';
  ov.innerHTML = `
    <div style="background:#fff;padding:40px;border-radius:8px;text-align:center;max-width:420px">
      <div style="font-size:42px;margin-bottom:14px">🤖</div>
      <div style="font-size:15px;font-weight:500;color:#222;margin-bottom:6px">Génération IA en cours</div>
      <div style="font-size:12px;color:#666;line-height:1.6">L'IA analyse le process <strong>${escapeHtml(procName)}</strong> et propose 8 contrôles d'audit adaptés.<br>Cela prend 10-20 secondes.</div>
    </div>`;
  document.body.appendChild(ov);

  try {
    const suggestions = await aiSuggestControls(procName, { entity: ap.entite });
    document.getElementById('ai-ov').remove();
    if (!suggestions || suggestions.length === 0) {
      if (typeof toast === 'function') toast('Aucune suggestion générée');
      return;
    }
    showSuggestedControlsModal(auditId, procName, suggestions);
  } catch (e) {
    document.getElementById('ai-ov').remove();
    if (typeof toast === 'function') toast('Erreur IA : ' + e.message);
  }
}

// Modale de validation des contrôles suggérés par l'IA
function showSuggestedControlsModal(auditId, procName, suggestions) {
  const ov = document.createElement('div');
  ov.id = 'ai-sug-ov';
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1001;display:flex;align-items:center;justify-content:center;padding:20px';

  let listHtml = '';
  suggestions.forEach((c, idx) => {
    listHtml += `
      <label style="display:flex;gap:10px;padding:10px 14px;border-bottom:1px solid #f0f0f0;cursor:pointer;align-items:flex-start">
        <input type="checkbox" class="ai-sug-pk" data-idx="${idx}" checked style="margin-top:3px"/>
        <div style="flex:1">
          <div style="font-size:11px;color:#999;font-family:monospace">AI-${String(idx+1).padStart(3,'0')}</div>
          <div style="font-size:13px;font-weight:500;color:#222;margin-top:1px">${escapeHtml(c.name)}</div>
          <div style="font-size:11px;color:#666;margin-top:2px">${escapeHtml(c.description || '')}</div>
          ${c.wcgw ? `<div style="font-size:11px;color:#854F0B;margin-top:4px"><strong>Risque :</strong> ${escapeHtml(c.wcgw)}</div>` : ''}
          ${c.testProcedure ? `<div style="font-size:11px;color:#085041;margin-top:2px"><strong>Test :</strong> ${escapeHtml(c.testProcedure)}</div>` : ''}
          <div style="margin-top:6px;display:flex;gap:5px;flex-wrap:wrap">
            ${c.key ? '<span style="background:#FAEEDA;color:#854F0B;padding:1px 7px;border-radius:10px;font-size:10px">Clé</span>' : ''}
            <span style="background:${c.nature==='IT-Dependent'?'#EEEDFE':'#F1EFE8'};color:${c.nature==='IT-Dependent'?'#3C3489':'#444'};padding:1px 7px;border-radius:10px;font-size:10px">${escapeHtml(c.nature || 'Manual')}</span>
            <span style="background:#E6F1FB;color:#0C447C;padding:1px 7px;border-radius:10px;font-size:10px">${escapeHtml(c.frequency || 'Ad hoc')}</span>
            ${c.owner ? `<span style="background:#F1EFE8;color:#444;padding:1px 7px;border-radius:10px;font-size:10px">${escapeHtml(c.owner)}</span>` : ''}
          </div>
        </div>
      </label>`;
  });

  ov.innerHTML = `
    <div style="background:#fff;border-radius:8px;max-width:900px;width:100%;max-height:85vh;display:flex;flex-direction:column">
      <div style="padding:14px 18px;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center">
        <div style="font-size:15px;font-weight:600">🤖 Contrôles suggérés par l'IA</div>
        <button onclick="document.getElementById('ai-sug-ov').remove()" style="background:none;border:none;font-size:22px;cursor:pointer;color:#999">×</button>
      </div>
      <div style="background:#EEEDFE;color:#3C3489;padding:8px 12px;font-size:12px">
        L'IA a généré ${suggestions.length} contrôles pour <strong>${escapeHtml(procName)}</strong>. Décoche ceux que tu ne veux pas et clique Importer.
      </div>
      <div style="flex:1;overflow:auto">${listHtml}</div>
      <div style="padding:12px 16px;border-top:1px solid #eee;display:flex;justify-content:flex-end;gap:8px">
        <button onclick="document.getElementById('ai-sug-ov').remove()"
          style="padding:6px 14px;border:1px solid #ccc;background:#fff;border-radius:4px;cursor:pointer;font-size:13px">
          Annuler
        </button>
        <button id="ai-sug-ok"
          style="padding:6px 14px;border:none;background:#3C3489;color:#fff;border-radius:4px;cursor:pointer;font-size:13px;font-weight:500">
          Importer la sélection
        </button>
      </div>
    </div>`;
  document.body.appendChild(ov);

  document.getElementById('ai-sug-ok').addEventListener('click', async () => {
    const picks = Array.from(document.querySelectorAll('.ai-sug-pk:checked')).map(i => parseInt(i.dataset.idx));
    if (picks.length === 0) {
      if (typeof toast === 'function') toast('Aucun contrôle sélectionné');
      return;
    }

    const d = AUD_DATA[auditId];
    if (!d) { if (typeof toast === 'function') toast('Données audit introuvables'); return; }
    const stepKey = String((typeof CS !== 'undefined' && CS !== null) ? CS : 4);
    if (!d.controls) d.controls = {};
    if (!d.controls[stepKey]) d.controls[stepKey] = [];

    let added = 0;
    picks.forEach(idx => {
      const src = suggestions[idx];
      d.controls[stepKey].push({
        name: src.name,
        description: src.description || '',
        owner: src.owner || 'Finance',
        freq: src.frequency || 'Ad hoc',
        clef: src.key === true,
        design: 'target',  // Suggestion IA = à mettre en place
        result: null,
        testNature: '',
        finding: '',
        // Traçabilité IA
        addedFromAI: true,
        aiWcgw: src.wcgw,
        aiTestProcedure: src.testProcedure,
        aiNature: src.nature,
        addedAt: new Date().toISOString(),
      });
      added++;
    });

    if (typeof saveAuditData === 'function') await saveAuditData(auditId);
    if (typeof addHist === 'function') addHist(auditId, `${added} contrôle(s) suggéré(s) par IA importé(s)`);

    document.getElementById('ai-sug-ov').remove();
    if (typeof toast === 'function') toast(`${added} contrôle(s) IA importé(s) ✓`);

    const detContent = document.getElementById('det-content');
    if (detContent && typeof renderDetContent === 'function') {
      detContent.innerHTML = renderDetContent();
    }
  });
}

// Helper d'échappement
function escapeHtml(s) {
  if (s === null || s === undefined) return '';
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
