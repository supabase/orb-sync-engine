import Orb from 'orb-billing';
import type { HeadersLike } from 'orb-billing/core';
import type { CreditNoteWebhook, CustomerWebhook, InvoiceWebhook, OrbWebhook, SubscriptionWebhook } from './types.d.ts';
import { PostgresClient } from './database/postgres';
import { syncCustomers } from './sync/customers.js';
import { syncSubscriptions } from './sync/subscriptions.js';
import { syncInvoices } from './sync/invoices.js';
import { syncCreditNotes } from './sync/credit_notes.js';

export type OrbSyncConfig = {
  databaseUrl: string;

  /** Defaults to "orb" */
  databaseSchema?: string;

  /** API key to sync an entity from the Orb API, not necessary for webhook syncs */
  orbApiKey?: string;

  /** Needed to verify the signature of a webhook */
  orbWebhookSecret: string;

  /** Control whether webhook signatures should be verified. Defaults to true */
  verifyWebhookSignature?: boolean;
};

export class OrbSync {
  private orb: Orb;
  private postgresClient: PostgresClient;

  constructor(private config: OrbSyncConfig) {
    this.orb = new Orb({ apiKey: config.orbApiKey, webhookSecret: config.orbWebhookSecret });
    this.postgresClient = new PostgresClient({
      databaseUrl: config.databaseUrl,
      schema: config.databaseSchema || 'orb',
    });
  }

  async sync(payload: string, headers: HeadersLike | undefined) {
    if (this.config.verifyWebhookSignature ?? true) {
      this.orb.webhooks.verifySignature(payload, headers || {}, this.config.orbWebhookSecret);
    }

    const parsedData = JSON.parse(payload) as OrbWebhook;
    switch (parsedData.type) {
      case 'customer.created':
      case 'customer.credit_balance_depleted':
      case 'customer.credit_balance_dropped': {
        await syncCustomers(this.postgresClient, [(parsedData as CustomerWebhook).customer]);
        break;
      }

      case 'subscription.created':
      case 'subscription.cost_exceeded':
      case 'subscription.ended':
      case 'subscription.plan_changed':
      case 'subscription.usage_exceeded':
      case 'subscription.started': {
        await syncSubscriptions(this.postgresClient, [(parsedData as SubscriptionWebhook).subscription]);
        break;
      }

      case 'invoice.edited':
      case 'invoice.issued':
      case 'invoice.manually_marked_as_void':
      case 'invoice.payment_failed':
      case 'invoice.payment_succeeded': {
        await syncInvoices(this.postgresClient, [(parsedData as InvoiceWebhook).invoice]);
        break;
      }

      case 'credit_note.issued':
      case 'credit_note.marked_as_void': {
        await syncCreditNotes(this.postgresClient, [(parsedData as CreditNoteWebhook).credit_note]);
        break;
      }

      default: {
        throw new Error(`Unsupported webhook event type: ${parsedData.type}`);
      }
    }
  }
}
