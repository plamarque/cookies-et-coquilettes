# Publication sur les stores

## Objet

Ce guide décrit comment publier **Cookies & Coquillettes** (PWA) sur Apple App Store et Google Play Store en s'appuyant sur un packaging PWA (PWABuilder/TWA + wrapper iOS).

Références :
- `docs/ARCH.md`
- `docs/DEPLOYMENT.md`

## 1. Prérequis communs

- PWA déployée en HTTPS public (GitHub Pages ou domaine custom)
- Manifest complet (nom, icônes, description, `start_url`)
- Service worker valide
- Build de production vérifié

Comptes nécessaires :

| Store | Compte |
|-------|--------|
| Google Play | Google Play Console |
| Apple | Apple Developer Program |

## 2. Validation avant packaging

1. Vérifier le comportement standalone de la PWA.
2. Vérifier l'offline minimal (écran d'accueil + navigation de base).
3. Vérifier les assets stores (icône, screenshots smartphone/tablette).
4. Générer les captures avec :

```bash
npm run screenshots
```

Sortie :
- `apps/web/public/screenshots/ios/...`
- `apps/web/public/screenshots/android/...`

## 3. Packaging via PWABuilder

1. Aller sur https://pwabuilder.com
2. Saisir l'URL de production de l'application
3. Générer les packages Android et iOS
4. Renseigner les métadonnées demandées

## 4. Google Play (Android / TWA)

### 4.1 Console Google Play

1. Créer l'application dans Play Console.
2. Remplir la fiche store :
   - description courte/longue
   - catégorie
   - politique de confidentialité
   - captures smartphone + tablette
3. Uploader l'AAB en piste interne (internal testing), puis production.

### 4.2 Digital Asset Links (standalone Android)

Pour éviter l'affichage de la barre navigateur dans la TWA, publier `assetlinks.json` sur le domaine racine :

`https://<domaine>/.well-known/assetlinks.json`

Étapes :
1. Récupérer le fingerprint SHA-256 dans Play Console (App Integrity / App signing)
2. Générer `assetlinks.json`
3. Le publier sur le domaine racine
4. Vérifier via l'API Digital Asset Links Google

## 5. Apple App Store (iOS wrapper)

### 5.1 Pré-requis

- Mac + Xcode à jour
- Compte Apple Developer
- Projet iOS wrapper généré depuis PWABuilder

### 5.2 App Store Connect

1. Créer l'app dans App Store Connect.
2. Remplir les métadonnées.
3. Uploader les screenshots iPhone/iPad.
4. Uploader le build iOS (Xcode Organizer / Fastlane).
5. Soumettre pour review.

## 6. Assets et contenus à préparer

- Icône store haute résolution
- Feature graphic (Play Store)
- Captures smartphone + tablette
- Politique de confidentialité (URL publique)
- Description marketing courte + longue

## 7. CI/CD release (inspiration Chrono EPS)

Ce repo dispose déjà du déploiement push pour :
- PWA : GitHub Pages
- BFF : Render

Pour automatiser les releases stores comme sur Chrono EPS, prévoir ensuite :
- workflow `release-stores.yml` déclenché par tag `v*`
- workflow `promote-stores.yml` déclenché manuellement
- scripts utilitaires `release-version.sh` et `promote-to-stores.sh`

Ces workflows nécessitent des secrets store (Play Console + App Store Connect).

## 8. Secrets typiques pour pipelines stores

Exemples de secrets GitHub à prévoir (selon l'implémentation retenue) :

- `PLAY_STORE_SERVICE_ACCOUNT`
- `ANDROID_KEYSTORE_BASE64`
- `BUBBLEWRAP_KEYSTORE_PASSWORD`
- `BUBBLEWRAP_KEY_PASSWORD`
- `APPSTORE_ISSUER_ID`
- `APPSTORE_KEY_ID`
- `APPSTORE_API_PRIVATE_KEY`
- `MATCH_PASSWORD`
- `MATCH_GIT_URL`
- `MATCH_GIT_BASIC_AUTHORIZATION`
