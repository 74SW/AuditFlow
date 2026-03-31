// ============================================================
// AUDITFLOW — AUTHENTIFICATION SSO
// Gère la connexion via Azure AD avec MSAL
// ============================================================

class AuthService {

  constructor(config) {
    this.config = config;
    this.msalApp = null;
    this.account = null;
    this.accessToken = null;
  }

  // Initialise MSAL avec votre configuration Azure AD
  async init() {
    const msalConfig = {
      auth: {
        clientId: this.config.clientId,
        authority: `https://login.microsoftonline.com/${this.config.tenantId}`,
        redirectUri: window.location.origin + window.location.pathname,
      },
      cache: {
        cacheLocation: "sessionStorage",
        storeAuthStateInCookie: false,
      },
    };

    this.msalApp = new msal.PublicClientApplication(msalConfig);
    await this.msalApp.initialize();

    // Gère le retour après redirection
    const response = await this.msalApp.handleRedirectPromise();
    if (response) {
      this.account = response.account;
      this.accessToken = response.accessToken;
    }
  }

  // Vérifie si l'utilisateur est connecté
  isLoggedIn() {
    const accounts = this.msalApp?.getAllAccounts() || [];
    if (accounts.length > 0) {
      this.account = accounts[0];
      return true;
    }
    return false;
  }

  // Lance la connexion SSO
  async login() {
    await this.msalApp.loginRedirect({
      scopes: ["User.Read", "Sites.ReadWrite.All", "Files.ReadWrite.All"],
    });
  }

  // Déconnexion
  async logout() {
    await this.msalApp.logoutRedirect({
      account: this.account,
    });
  }

  // Récupère un token d'accès valide (renouvellement automatique)
  async getAccessToken() {
    if (!this.account) return null;
    try {
      const response = await this.msalApp.acquireTokenSilent({
        scopes: ["User.Read", "Sites.ReadWrite.All", "Files.ReadWrite.All"],
        account: this.account,
      });
      this.accessToken = response.accessToken;
      return this.accessToken;
    } catch(e) {
      // Token expiré — relance la connexion
      await this.msalApp.acquireTokenRedirect({
        scopes: ["User.Read", "Sites.ReadWrite.All", "Files.ReadWrite.All"],
      });
    }
  }

  // Retourne les infos de l'utilisateur connecté
  getUserInfo() {
    if (!this.account) return null;
    const email = this.account.username?.toLowerCase();
    const member = this.config.team.find(m => m.email.toLowerCase() === email);
    return {
      name: member?.name || this.account.name,
      email: this.account.username,
      role: member?.role || "auditeur",
      id: member?.id || "unknown",
      initials: (member?.name || this.account.name || "?")
        .split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2),
    };
  }

  // Vérifie si l'utilisateur a les droits admin
  isAdmin() {
    const user = this.getUserInfo();
    return user?.role === "admin";
  }
}
