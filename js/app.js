// ============================================================
// AUDITFLOW — APPLICATION PRINCIPALE
// Gère la navigation, l'authentification et le chargement
// ============================================================

const auth = new AuthService(AUDITFLOW_CONFIG);
let currentView = 'dashboard';

// ---- INITIALISATION ----

async function initApp() {
  await auth.init();

  if (!auth.isLoggedIn()) {
    // Affiche l'écran de connexion
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('app').style.display = 'none';
    document.getElementById('login-btn').onclick = () => auth.login();
    return;
  }

  // Utilisateur connecté
  const user = auth.getUserInfo();
  STATE.user = user;

  // Met à jour l'interface avec les infos de l'utilisateur
  document.getElementById('user-av').textContent = user.initials;
  document.getElementById('user-name').textContent = user.name;
  document.getElementById('user-role').textContent = user.role === 'admin' ? 'Admin / Directeur' : 'Auditrice';
  if (user.role === 'admin') document.getElementById('app').classList.add('is-admin');

  // Affiche l'app
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').style.display = 'flex';

  // Déconnexion
  document.getElementById('logout-btn').onclick = () => auth.logout();

  // Tente de se connecter à SharePoint
  try {
    const token = await auth.getAccessToken();
    if (token && AUDITFLOW_CONFIG.clientId !== 'VOTRE_CLIENT_ID_ICI') {
      STATE.sp = new SharePointService(token, AUDITFLOW_CONFIG);
      await STATE.sp.initLists();
      STATE.connected = true;
      toast('Connecté à SharePoint ✓');
    }
  } catch(e) {
    console.warn('SharePoint non disponible, mode local activé');
  }

  // Navigation
  document.querySelectorAll('.nav[data-view]').forEach(nav => {
    nav.addEventListener('click', () => navigate(nav.dataset.view));
  });

  // Vue initiale
  navigate('dashboard');
}

// ---- NAVIGATION ----

function navigate(view) {
  currentView = view;

  // Met à jour la sidebar
  document.querySelectorAll('.nav[data-view]').forEach(n => n.classList.remove('active'));
  const activeNav = document.getElementById(`nav-${view}`);
  if (activeNav) activeNav.classList.add('active');

  // Rend la vue
  const container = document.getElementById('view-container');
  container.innerHTML = '<div class="loading"><div class="spinner"></div>Chargement...</div>';

  setTimeout(() => {
    try {
      const html = VIEWS[view] ? VIEWS[view]() : `<div class="content"><p>Vue "${view}" non trouvée.</p></div>`;
      container.innerHTML = html;
      if (VIEWS_INIT[view]) VIEWS_INIT[view]();
    } catch(e) {
      container.innerHTML = `<div class="content"><p style="color:var(--red)">Erreur : ${e.message}</p></div>`;
      console.error(e);
    }
  }, 50);
}

// ---- MODAL ----

function openModal(title, bodyHTML, onConfirm) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = bodyHTML;
  document.getElementById('modal-overlay').style.display = 'flex';
  document.getElementById('modal-confirm').onclick = () => { onConfirm(); closeModal(); };
  document.getElementById('modal-cancel').onclick = closeModal;
  document.getElementById('modal-close').onclick = closeModal;
}

function closeModal() {
  document.getElementById('modal-overlay').style.display = 'none';
}

// ---- TOAST ----

function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2500);
}

// ---- HELPERS ----

function addHistory(type, msg) {
  STATE.history.unshift({
    type, msg,
    user: STATE.user?.name || 'Philippe M.',
    date: new Date().toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' }),
  });
  if (STATE.connected && STATE.sp) {
    STATE.sp.addHistory(type, msg, STATE.user?.name);
  }
}

function getAuditTasks(audit) {
  if (!STATE.tasks[audit.id]) {
    STATE.tasks[audit.id] = defaultTasks(audit.id, audit.assignedTo || ['sh']);
  }
  return STATE.tasks[audit.id];
}

// ---- DÉMARRAGE ----

window.addEventListener('DOMContentLoaded', initApp);
