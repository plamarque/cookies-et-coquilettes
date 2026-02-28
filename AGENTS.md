# Agents

## Sources de vérité (normatifs)

- **docs/SPEC.md** — Ce que le système fait ; contrat fonctionnel.
- **docs/DOMAIN.md** — Vocabulaire et règles du domaine.
- **docs/ARCH.md** — Structure et technologies.
- **docs/WORKFLOW.md** — Quand mettre à jour quel document.
- **docs/ADR/** — Décisions d’architecture.

Ne pas contredire ces documents. Le code et les changements doivent s’y aligner.

## Suivi et opérationnels (non normatifs)

- **docs/PLAN.md** — Livraison : tranches, jalons, statut des tâches. Utiliser pour le suivi, pas pour définir le comportement.
- **docs/ISSUES.md** — Bugs, limitations, travail différé. Utiliser uniquement pour le suivi des problèmes.
- **docs/DEVELOPMENT.md** — Configuration, commandes, contribution. Opérationnel uniquement.

## Workflow pour les agents

1. Lire SPEC, DOMAIN et ARCH avant de modifier le comportement ou la structure.
2. Utiliser PLAN pour « quoi faire ensuite » et ISSUES pour « ce qui est cassé ou différé ».
3. Lors de la mise à jour des docs : modifier les docs normatifs quand le comportement ou la structure change ; garder les docs de suivi factuels.
