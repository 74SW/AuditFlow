# AuditFlow — Guide de déploiement

Application de gestion d'audit interne, déployée sur **Azure Static Web Apps** avec authentification **Microsoft Entra ID** (SSO) et stockage des données sur **SharePoint** via **Microsoft Graph API**.

## Architecture

- **Frontend** : SPA HTML/CSS/JS pure, hébergée sur Azure Static Web Apps
- **Authentification** : MSAL (Microsoft Authentication Library) avec SSO Entra ID — **aucun mot de passe stocké côté application**
- **Données** : Listes SharePoint via Microsoft Graph API
- **Documents** : Bibliothèque SharePoint Documents (SharePoint Drive)

## Configuration

### 1. Azure AD / Entra ID

Créer une **Enterprise Application** dans le tenant cible avec :
- Permissions Microsoft Graph délégué : `Sites.ReadWrite.All`, `User.Read`, `Files.ReadWrite.All`
- Redirect URI : URL de l'app (`https://<votre-static-web-app>.azurestaticapps.net`)
- Récupérer le `clientId` (Application ID) et le `tenantId`

### 2. SharePoint

Créer un site SharePoint dédié et y créer les listes suivantes (chaque liste a son schéma de colonnes — voir `js/graph.js` pour le détail) :

- `AF_Users` — utilisateurs autorisés et leurs rôles
- `AF_AuditPlan` — plan d'audit (missions Process / BU / Other)
- `AF_AuditData` — données par audit (tâches, contrôles, WCGW, findings, notes)
- `AF_Processes` — processus auditables avec liens vers les risques
- `AF_RiskUniverse` — référentiel des risques (URD + opérationnels)
- `AF_ProductLines` — lignes de produits par société
- `AF_Structure` — structure du groupe (régions / pays / sociétés)
- `AF_Actions` — plans d'action de suivi
- `AF_History` — journal d'audit (logs)
- `AF_Config` — paramètres globaux

### 3. Configuration de l'app

Éditer `config.js` :

```javascript
const AUDITFLOW_CONFIG = {
  clientId:    '<votre-application-id>',
  tenantId:    '<votre-tenant-id>',
  siteUrl:     'https://<tenant>.sharepoint.com/sites/<votre-site>',
  appUrl:      'https://<votre-static-web-app>.azurestaticapps.net',
};
```

## Authentification

L'authentification est **entièrement gérée par Microsoft Entra ID (SSO)**.
- Les utilisateurs se connectent avec leurs identifiants professionnels Microsoft (compte Axway/74Software)
- Aucun mot de passe n'est stocké dans la base de l'application
- La gestion du mot de passe (modification, MFA, appareils de confiance) se fait via le portail Microsoft : https://mysignins.microsoft.com/security-info

## Gestion des accès

Les rôles disponibles sont définis dans la liste `AF_Users` :
- **`admin`** — Admin / Directeur : accès complet, validation des étapes, gestion du Plan Audit et des utilisateurs
- **`auditeur`** — Auditrice : accès aux audits assignés, remplissage des tâches, contrôles, findings et documents
- **`viewer`** — Viewer : accès en lecture seule

Pour ajouter un utilisateur, utiliser le bouton **"+ Inviter"** dans la vue **Rôles & Accès**, ou créer manuellement une entrée dans la liste SharePoint `AF_Users` avec les champs `email`, `name`, `role`, `initials`, `status`, `source`.

## Déploiement

Push sur la branche connectée à Azure Static Web Apps. Le déploiement est automatique via GitHub Actions.

---

## Sécurité

- **Aucun secret cryptographique** dans le code source. Le `clientId` et `tenantId` ne sont pas des secrets (visibles publiquement par toute application MSAL).
- **Authentification SSO Entra ID** — la révocation d'un compte au niveau de l'AD invalide automatiquement l'accès à l'app.
- **Tokens en sessionStorage** — pas de persistance disque, scope limité au navigateur. Renouvellement automatique géré par MSAL.
- **Permissions SharePoint** — l'accès aux listes et fichiers est filtré par les permissions du site SharePoint au niveau du groupe AD.
