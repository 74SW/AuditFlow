# AuditFlow — Guide de déploiement

## Ce que contient ce dossier

```
auditflow/
├── index.html          ← Page principale de l'application
├── config.js           ← ⚡ FICHIER À REMPLIR avec vos infos IT
├── css/
│   └── app.css         ← Styles de l'interface
└── js/
    ├── app.js          ← Logique principale
    ├── auth.js         ← Authentification Azure AD (SSO)
    ├── data.js         ← Données et constantes
    ├── views.js        ← Toutes les pages de l'outil
    └── sharepoint.js   ← Connexion SharePoint
```

---

## Étape 1 — Remplir config.js

Ouvrez le fichier `config.js` et remplacez les 3 valeurs :

```javascript
clientId:      "VOTRE_CLIENT_ID_ICI",      // ← fourni par votre IT
tenantId:      "VOTRE_TENANT_ID_ICI",      // ← fourni par votre IT
sharePointUrl: "VOTRE_URL_SHAREPOINT_ICI", // ← URL de votre site SharePoint
```

**Exemple une fois rempli :**
```javascript
clientId:      "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
tenantId:      "f9e8d7c6-b5a4-3210-fedc-ba9876543210",
sharePointUrl: "https://votregroupe.sharepoint.com/sites/AuditInterne",
```

---

## Étape 2 — Déposer les fichiers sur SharePoint

1. Allez sur votre site SharePoint Audit Interne
2. Cliquez sur **Documents** dans le menu de gauche
3. Créez un nouveau dossier appelé **AuditFlow**
4. Ouvrez ce dossier et déposez **tous les fichiers** (y compris les sous-dossiers `css/` et `js/`)
5. Cliquez sur `index.html` dans SharePoint
6. Copiez l'URL de la page → c'est l'adresse de votre application

---

## Étape 3 — Partager l'URL avec votre équipe

Partagez simplement l'URL avec Philippe, Selma et Nisrine.
Chacun se connecte avec son compte Microsoft habituel — aucun mot de passe supplémentaire.

---

## Fonctionnement hors connexion SharePoint

Si le `config.js` n'est pas encore rempli (pendant les tests), l'application fonctionne
en mode local avec les données d'exemple. Aucune donnée n'est sauvegardée, mais vous
pouvez naviguer et tester toutes les fonctionnalités.

---

## Mettre à jour l'application

Pour mettre à jour l'outil dans le futur :
1. Remplacez les fichiers modifiés dans le dossier SharePoint
2. Rechargez la page — la mise à jour est immédiate

---

## Besoin d'aide ?

Revenez sur Claude et partagez ce que vous observez.
Toutes les modifications se font dans les fichiers `js/views.js` et `js/data.js`.
