import type { PaymentModel, RiskItem, FailureScenario, KPIItem } from '@/types'

// ─── Model metadata ───────────────────────────────────────────────────────────

export const MODEL_LABELS: Record<PaymentModel, string> = {
  'one-off': 'Paiement one-off',
  'recurring': 'Paiement récurrent (MIT)',
  'mit-post-service': 'MIT post-service',
  'pre-auth-capture': 'Pré-autorisation puis capture',
  'multi-authorization': 'Multi-autorisation / ajustement',
  'sepa-sdd': 'SEPA SDD (prélèvement)',
  'debt-recovery': 'Dette avec rejeu',
  'refund': 'Remboursement simple',
  'hybrid': 'Flux hybride à confirmer',
}

export const MODEL_DESCRIPTIONS: Record<PaymentModel, string> = {
  'one-off':
    'Transaction unique, montant fixe connu, client présent et consentant au moment du débit. Le flux le plus simple et le mieux couvert par les réseaux.',
  'recurring':
    "Prélèvements futurs initiés par le marchand (MIT) sans présence du client, sur la base d'un consentement initial (CIT). Modèle central des abonnements SaaS, streaming et services récurrents.",
  'mit-post-service':
    "Débit initié par le marchand après consommation du service, lorsque le montant final n'est connu qu'à la fin. Le client a consenti au départ mais n'est pas présent au débit réel.",
  'pre-auth-capture':
    "Réservation des fonds au départ (pré-autorisation), puis capture au montant réel après consommation. Protège le marchand et le client, mais crée une complexité opérationnelle sur la gestion des expirys.",
  'multi-authorization':
    "Ajustements successifs du montant autorisé pendant la session. Nécessite le support de l'incremental authorization côté réseau et acquéreur.",
  'sepa-sdd':
    "Prélèvement bancaire via le réseau SEPA, sur mandat signé. Modèle dominant pour les paiements B2C et B2B récurrents en zone euro, notamment pour les abonnements et les factures.",
  'debt-recovery':
    "Flux de recouvrement activé après un échec de paiement ayant créé une créance. Combine relances automatiques (dunning), plans de paiement et escalade vers le recouvrement amiable ou judiciaire.",
  'refund':
    "Opération de remboursement partiel ou total d'une transaction existante. Flux inverse du paiement initial, nécessite une traçabilité forte et une logique d'idempotence.",
  'hybrid':
    "Cas ambigu impliquant plusieurs modèles potentiels. L'architecture finale dépend de clarifications métier supplémentaires avant de trancher.",
}

// ─── Critical data points by model ───────────────────────────────────────────

export const MODEL_CRITICAL_DATA: Record<PaymentModel, string[]> = {
  'one-off': [
    'payment_intent_id', 'authorization_code', 'merchant_reference',
    'amount + currency', 'card_bin', '3ds_result', 'capture_method',
  ],
  'recurring': [
    'subscription_id', 'customer_id', 'payment_method_token',
    'billing_cycle_anchor', 'next_billing_date', 'retry_count',
    'dunning_state', 'cit_payment_id (référence du consentement initial)',
  ],
  'mit-post-service': [
    'session_id', 'service_start_time', 'service_end_time',
    'initial_consent_payment_id', 'final_amount', 'mit_reference',
    'customer_id', 'payment_method_token',
  ],
  'pre-auth-capture': [
    'pre_auth_id', 'preauth_amount', 'preauth_expiry_date',
    'capture_amount', 'capture_reference', 'session_id',
    'release_status', 'incremental_auth_count',
  ],
  'multi-authorization': [
    'initial_auth_id', 'adjustment_sequence', 'current_authorized_amount',
    'incremental_auth_ids[]', 'final_capture_amount', 'session_id',
  ],
  'sepa-sdd': [
    'mandate_id', 'ICS_creditor', 'debtor_IBAN', 'debtor_BIC',
    'sequence_type (FRST/RCUR/FNAL/OOFF)', 'due_date',
    'pain008_message_id', 'r_transaction_reason_code',
  ],
  'debt-recovery': [
    'debt_id', 'original_payment_id', 'original_amount',
    'current_balance', 'debtor_id', 'creation_date',
    'retry_schedule', 'plan_id', 'legal_deadline',
  ],
  'refund': [
    'refund_id', 'original_payment_id', 'refund_amount',
    'refund_reason_code', 'initiator_id', 'idempotency_key',
    'psp_refund_reference', 'validated_by',
  ],
  'hybrid': [
    'correlation_id (liant tous les flux)', 'primary_payment_id',
    'secondary_flows[]', 'state_machine_status',
  ],
}

// ─── Status lifecycles by model ───────────────────────────────────────────────

export const MODEL_STATUSES: Record<PaymentModel, string[]> = {
  'one-off': [
    'initiated', 'pending_3ds', 'authorized', 'captured', 'settled', 'refunded', 'declined', 'disputed', 'expired',
  ],
  'recurring': [
    'trialing', 'active', 'past_due', 'unpaid', 'paused', 'canceled', 'incomplete', 'recovered',
  ],
  'mit-post-service': [
    'consent_captured', 'service_started', 'service_ended',
    'amount_computed', 'mit_submitted', 'mit_settled', 'mit_failed', 'debt_created',
  ],
  'pre-auth-capture': [
    'preauth_pending', 'preauth_authorized', 'session_active',
    'capture_pending', 'captured', 'released', 'expired', 'disputed',
  ],
  'multi-authorization': [
    'initial_auth', 'incremented', 'decremented', 'capture_pending', 'captured', 'released',
  ],
  'sepa-sdd': [
    'mandate_pending', 'mandate_active', 'mandate_suspended', 'mandate_revoked',
    'submitted', 'pending_settlement', 'settled', 'returned', 'refunded',
  ],
  'debt-recovery': [
    'identified', 'qualified', 'first_contact', 'in_negotiation',
    'plan_active', 'plan_broken', 'settled', 'litigated', 'prescribed', 'written_off',
  ],
  'refund': [
    'requested', 'pending_validation', 'validated', 'rejected',
    'submitted_to_psp', 'processing', 'completed', 'failed', 'partially_refunded',
  ],
  'hybrid': [
    'flow_a_active', 'flow_b_active', 'pending_resolution', 'resolved', 'escalated',
  ],
}

// ─── KPIs by model ────────────────────────────────────────────────────────────

export const MODEL_KPIS: Record<PaymentModel, KPIItem[]> = {
  'one-off': [
    { label: "Taux de conversion", description: "Transactions réussies / initiées", unit: "%" },
    { label: "Taux d'autorisation", description: "Acceptations réseau / tentatives", unit: "%" },
    { label: "Taux de chargeback", description: "Cible < 1%", unit: "%" },
    { label: "Délai de règlement moyen", description: "Jours entre capture et crédit", unit: "j" },
    { label: "Taux de fraude détectée", unit: "%" },
  ],
  'recurring': [
    { label: "MRR / ARR", description: "Revenu mensuel/annuel récurrent", unit: "€" },
    { label: "Taux de churn involontaire", description: "Résiliations dues aux échecs de paiement", unit: "%" },
    { label: "Taux de récupération dunning", description: "Paiements récupérés après échec initial", unit: "%" },
    { label: "Failed charge rate", description: "Tentatives échouées / total", unit: "%" },
    { label: "LTV client", unit: "€" },
  ],
  'mit-post-service': [
    { label: "Taux de succès MIT", description: "MIT acceptés / soumis", unit: "%" },
    { label: "Écart montant estimé / final", description: "Précision de l'estimation initiale", unit: "%" },
    { label: "Délai débit post-service", unit: "min" },
    { label: "Taux de dette créée", description: "MIT échoués créant une créance", unit: "%" },
  ],
  'pre-auth-capture': [
    { label: "Taux d'expiration pré-auth", unit: "%" },
    { label: "Écart pré-auth / capture", unit: "€" },
    { label: "Durée moyenne de session", unit: "min" },
    { label: "Taux de release réussie", unit: "%" },
    { label: "Litiges post-capture", unit: "nb" },
  ],
  'multi-authorization': [
    { label: "Nombre moyen d'ajustements par session", unit: "nb" },
    { label: "Taux d'incremental auth refusé", unit: "%" },
    { label: "Écart final vs première auth", unit: "€" },
    { label: "Taux de capture hors fenêtre", unit: "%" },
  ],
  'sepa-sdd': [
    { label: "Taux de R-transactions", description: "Retours / prélèvements soumis", unit: "%" },
    { label: "Taux de contestation mandats", description: "Cible < 0.5%", unit: "%" },
    { label: "Délai moyen d'encaissement", unit: "j" },
    { label: "Taux de récupération R-transactions", unit: "%" },
    { label: "Coût unitaire SEPA", unit: "€" },
  ],
  'debt-recovery': [
    { label: "Taux de récupération", description: "Montant récupéré / total en recouvrement", unit: "%" },
    { label: "Délai moyen de résolution", unit: "j" },
    { label: "Coût par recouvrement", unit: "€" },
    { label: "Taux d'accord plan de paiement", unit: "%" },
    { label: "Taux de rupture de plan", unit: "%" },
  ],
  'refund': [
    { label: "Taux de remboursement", description: "Remboursements / total transactions", unit: "%" },
    { label: "Délai moyen de remboursement", unit: "j" },
    { label: "Coût remboursements / CA", unit: "%" },
    { label: "Taux de fraude au remboursement", unit: "%" },
    { label: "NPS post-remboursement", unit: "score" },
  ],
  'hybrid': [
    { label: "Taux de résolution sans escalade", unit: "%" },
    { label: "Délai de résolution flux hybride", unit: "h" },
    { label: "Taux d'erreur de routage", unit: "%" },
  ],
}

// ─── Failure scenarios by model ───────────────────────────────────────────────

export const MODEL_FAILURES: Record<PaymentModel, FailureScenario[]> = {
  'one-off': [
    {
      trigger: "Timeout réseau lors de l'autorisation",
      consequence: "Statut indéterminé — le client pense payer, le marchand ne sait pas",
      mitigation: "Implémenter une idempotency key sur chaque tentative, vérifier le statut avant tout retry",
    },
    {
      trigger: "Refus émetteur (code 05 - Do not honor)",
      consequence: "Transaction rejetée sans raison explicite exposable",
      mitigation: "Proposer un autre moyen de paiement, ne jamais exposer le code technique au client",
    },
    {
      trigger: "Fraude 3DS (phishing, SIM swap)",
      consequence: "Perte financière et chargeback potentiel",
      mitigation: "Renforcer la MFA, monitorer les anomalies comportementales pre-3DS",
    },
  ],
  'recurring': [
    {
      trigger: "Carte expirée sans mise à jour",
      consequence: "Churn involontaire — revenu perdu sur toute la LTV restante",
      mitigation: "Activer Account Updater Visa/MC, notifier le client J-30 avant expiry",
    },
    {
      trigger: "Refus hard (fraude, carte volée)",
      consequence: "Accès suspendu, relation client dégradée",
      mitigation: "Notification immédiate, portail self-service de mise à jour CB",
    },
    {
      trigger: "Dunning trop agressif",
      consequence: "Blocage de la carte par l'émetteur, escalade en chargeback",
      mitigation: "Respecter les règles Visa/MC sur les retries MIT (max 15/an, intervalles min)",
    },
  ],
  'mit-post-service': [
    {
      trigger: "MIT refusé après consommation du service",
      consequence: "Service délivré mais non payé — dette créée",
      mitigation: "Mettre en place un flux de recouvrement automatique dès le premier échec",
    },
    {
      trigger: "Montant final très supérieur à l'estimation",
      consequence: "Refus émetteur sur dépassement de plafond",
      mitigation: "Fixer un plafond raisonnable au consentement initial, informer le client",
    },
    {
      trigger: "Token expiré ou révoqué entre service et débit",
      consequence: "Impossible de débiter — service consommé à perte",
      mitigation: "Vérifier la validité du token avant début de service, ou exiger une pré-auth",
    },
  ],
  'pre-auth-capture': [
    {
      trigger: "Pré-auth expirée avant capture (J+7 à J+30 selon réseau)",
      consequence: "Fonds non réservés, débit potentiellement refusé",
      mitigation: "Surveiller les pré-auths proches de l'expiry (alerte J-2), forcer capture ou renouveler",
    },
    {
      trigger: "Montant capture > montant pré-auth",
      consequence: "Rejet réseau ou litige émetteur",
      mitigation: "Utiliser l'incremental authorization si possible, ou nouvelle pré-auth complémentaire",
    },
    {
      trigger: "Session orpheline (déconnexion client)",
      consequence: "Fonds bloqués sans libération, plainte client",
      mitigation: "Nettoyage batch nocturne avec timeout configurable, release automatique",
    },
  ],
  'multi-authorization': [
    {
      trigger: "Incremental auth refusé par l'émetteur",
      consequence: "Blocage de la session en cours",
      mitigation: "Vérifier le support incremental auth de l'acquéreur et du réseau avant usage",
    },
    {
      trigger: "Perte de cohérence des séquences d'auth",
      consequence: "Montant final incohérent, réconciliation impossible",
      mitigation: "Numéroter les séquences, stocker l'historique complet des auth IDs",
    },
  ],
  'sepa-sdd': [
    {
      trigger: "R-transaction reçue (code AM04 - insufficient funds)",
      consequence: "Prélèvement non exécuté, trésorerie impactée",
      mitigation: "Identifier le motif, relancer à J+3 ou proposer un autre moyen de paiement",
    },
    {
      trigger: "Mandat contesté dans les 8 semaines (CORE)",
      consequence: "Remboursement imposé sans recours immédiat",
      mitigation: "Conserver la preuve du mandat signé, mettre en place une procédure de réponse",
    },
    {
      trigger: "Fichier PAIN.008 rejeté par la banque",
      consequence: "Tout le batch est bloqué, retard de règlement",
      mitigation: "Valider le XML avant soumission, maintenir un log des erreurs par champ",
    },
  ],
  'debt-recovery': [
    {
      trigger: "Rupture du plan de paiement",
      consequence: "Retour en phase de recouvrement, coût augmenté",
      mitigation: "Escalade automatique après 2 échecs consécutifs, gestionnaire humain",
    },
    {
      trigger: "Approche de la prescription (délai légal)",
      consequence: "Créance irrécupérable légalement",
      mitigation: "Alertes automatiques J-90, J-30, J-7 pour décision contentieux",
    },
    {
      trigger: "Non-conformité RGPD dans le traitement",
      consequence: "Sanction CNIL, nullité de la procédure",
      mitigation: "Audit légal préalable, conserver la base légale documentée pour chaque action",
    },
  ],
  'refund': [
    {
      trigger: "Double remboursement par erreur opérationnelle",
      consequence: "Perte financière directe, écart comptable",
      mitigation: "Idempotency key obligatoire sur chaque appel PSP, vérification de statut avant soumission",
    },
    {
      trigger: "Transaction originale > 180 jours",
      consequence: "Refus réseau carte, remboursement bloqué",
      mitigation: "Basculer vers virement SEPA direct, coût opérationnel supplémentaire",
    },
    {
      trigger: "Fraude au remboursement (retour frauduleux)",
      consequence: "Perte produit + perte financière",
      mitigation: "Règles de détection comportementale, validation manuelle au-delà d'un seuil",
    },
  ],
  'hybrid': [
    {
      trigger: "Désynchronisation entre les deux flux",
      consequence: "État incohérent, réconciliation impossible",
      mitigation: "Identifier un correlation_id commun à tous les flux dès le début",
    },
    {
      trigger: "Règles métier contradictoires entre modèles",
      consequence: "Comportement imprévisible du système",
      mitigation: "Documenter explicitement la priorité des règles, tester tous les cas limites",
    },
  ],
}
