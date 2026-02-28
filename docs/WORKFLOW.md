# Workflow documentaire

## Rôle

Ce document décrit quand mettre à jour quel document du workflow de gouvernance documentaire.

## Documents et moments de mise à jour

| Document | Mettre à jour quand… |
|----------|----------------------|
| **SPEC.md** | Le périmètre fonctionnel change, une capacité est ajoutée ou retirée, les limites du système évoluent. |
| **DOMAIN.md** | Un nouveau terme, entité ou règle du domaine est introduit ou modifié. |
| **ARCH.md** | La structure technique change, un composant est ajouté ou retiré, la stack évolue. |
| **ADR/** | Une décision d’architecture significative est prise ; créer un nouveau fichier (ex. `0001-titre.md`). |
| **PLAN.md** | Une tranche ou une tâche progresse ; garder le statut à jour. |
| **ISSUES.md** | Un bug est identifié, une limitation est documentée, un travail est différé. |
| **DEVELOPMENT.md** | Les prérequis, commandes ou procédures de contribution changent. |

## Règles

1. **Normatifs (SPEC, DOMAIN, ARCH, WORKFLOW, ADR)** : définissent le comportement et la structure attendus. Les modifier quand le contrat ou l’architecture change.
2. **Suivi (PLAN, ISSUES)** : rester factuels ; ne pas inventer de tâches ou de bugs.
3. **Opérationnel (DEVELOPMENT)** : refléter les commandes et procédures réelles.
