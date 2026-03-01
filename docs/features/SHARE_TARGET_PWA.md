# Share Target PWA — Slice de développement

## Slide 1 — Objectif

- Permettre à **Cookies & Coquillettes** d’apparaître comme cible dans le partage natif OS.
- Cas visé : partager une URL (ex. post/réel) vers l’app pour lancer l’import automatiquement.

## Slide 2 — Fonctionnement implémenté

- Le manifest PWA déclare `share_target` en `GET` avec paramètres :
  - `share-url`
  - `share-text`
  - `share-title`
- Au démarrage, le front lit ces paramètres, déclenche l’import `SHARE`, puis nettoie l’URL.
- La source est conservée dans la recette (`source.type = SHARE`, `source.url` quand disponible).

## Slide 3 — Limites plateformes (PWA web)

- **Support principal** : Chrome/Edge/Opera (moteur Chromium), surtout sur Android avec PWA installée.
- **Non supporté** (à date) : Safari iOS/macOS, Firefox.
- Conséquence : sur iOS Safari, l’app n’apparaît pas comme cible de partage système.

## Slide 4 — Fallback multi-plateforme

- Fallback universel conservé : écran « Nouvelle recette » avec collage URL/texte/image + import fichier.
- Ajout d’un fallback UX :
  - bouton « Coller depuis le presse-papiers »,
  - message explicite de compatibilité dans l’écran d’import.

## Slide 5 — Stratégie d’extraction partage

- Si `share-url` est présent :
  1. tentative extraction page (JSON-LD / image),
  2. puis fallback parsing texte (LLM si clé présente),
  3. sinon draft minimal.
- Si pas d’URL : parsing du texte partagé (si disponible), sinon draft minimal.

## Slide 6 — Impacts

- **ARCH** : section compatibilité/dégradation enrichie (support + fallback).
- **SPEC** : import via partage conditionné à la compatibilité navigateur/OS.
- **ISSUES** : limitation Safari/Firefox documentée.
