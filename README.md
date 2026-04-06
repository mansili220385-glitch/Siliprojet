# Coach Architecture Paiement — v2

Moteur de raisonnement expert pour analyser des architectures de paiement.

## Stack

- **Next.js 14** (App Router) · **TypeScript** · **Tailwind CSS** · **lucide-react**
- Pas de backend — logique déterministe en TypeScript pur

## Démarrage

```bash
npm install
npm run dev
# → http://localhost:3000
```

## Architecture

```
coach-paiement/
├── app/
│   ├── page.tsx                    # Accueil
│   ├── analysis/page.tsx           # Questionnaire universel (15 signaux)
│   ├── result/page.tsx             # Résultat enrichi du moteur
│   ├── scenarios/page.tsx          # Sélection scénario
│   ├── analysis/[scenario]/        # Questionnaire v1 (legacy)
│   ├── result/[scenario]/          # Résultat v1 (legacy)
│   └── expert/[scenario]/          # Vue experte par scénario
├── lib/
│   ├── rules/
│   │   ├── paymentInference.ts     # Moteur de scoring et d'inférence
│   │   └── paymentModels.ts        # Définitions des 9 modèles (KPIs, statuts, données, échecs)
│   └── inference.ts                # Wrapper legacy
├── data/
│   ├── questionnaire.ts            # 15 questions universelles
│   ├── scenarios.ts                # Données des 6 scénarios
│   └── mock/cases.ts               # 5 cas types réalistes
└── types/index.ts                  # Types TypeScript complets
```

## Modèles de paiement couverts

| ID | Label |
|----|-------|
| `one-off` | Paiement one-off |
| `recurring` | Paiement récurrent (MIT) |
| `mit-post-service` | MIT post-service |
| `pre-auth-capture` | Pré-autorisation puis capture |
| `multi-authorization` | Multi-autorisation / ajustement |
| `sepa-sdd` | SEPA SDD (prélèvement) |
| `debt-recovery` | Dette avec rejeu |
| `refund` | Remboursement simple |
| `hybrid` | Flux hybride à confirmer |

## Signaux d'inférence

15 signaux binaires ou catégoriels :
- `amountKnownUpfront` · `amountVariable`
- `customerPresentAtFinalDebit` · `serviceConsumedBeforePayment`
- `paymentDeferred` · `paymentMethodReusable` · `paymentMethodType`
- `initialConsent` · `mandateRequired`
- `failureCreatesDebt` · `isSubscription` · `isRefund`
- `futureDebitWithoutCustomer` · `strongReconciliationNeeded` · `highOperationalRisk`

## Logique d'inférence

Le moteur (`lib/rules/paymentInference.ts`) fonctionne en 4 étapes :
1. **Scoring** — chaque modèle reçoit un score basé sur les signaux (règles additives/soustractives)
2. **Sélection** — le modèle avec le score le plus élevé est retenu (fallback `hybrid` si score < 15)
3. **Construction du résultat** — textes, risques, KPIs, statuts, données, scénarios de défaillance
4. **Arbre de décision** — trace des signaux ayant influencé la recommandation

## Ajouter un modèle

1. Ajouter le type dans `types/index.ts` → `PaymentModel`
2. Ajouter les métadonnées dans `lib/rules/paymentModels.ts`
3. Ajouter les règles de scoring dans `lib/rules/paymentInference.ts` → `scoreModels()`
4. Ajouter les textes dans les fonctions `generate*()` de `paymentInference.ts`
