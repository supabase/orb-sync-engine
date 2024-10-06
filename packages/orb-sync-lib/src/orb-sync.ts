import Orb from 'orb-billing';
import type { HeadersLike } from 'orb-billing/core';
import type {
  CreditNotesFetchParams,
  CreditNoteWebhook,
  CustomersFetchParams,
  CustomerWebhook,
  InvoicesFetchParams,
  InvoiceWebhook,
  OrbWebhook,
  PlansFetchParams,
  SubscriptionsFetchParams,
  SubscriptionWebhook,
} from './types';
import { PostgresClient } from './database/postgres';
import { fetchAndSyncCustomer, fetchAndSyncCustomers, syncCustomers } from './sync/customers';
import {
  fetchAndSyncSubscription,
  fetchAndSyncSubscriptions,
  syncSubscriptions,
  updateBillingCycle,
} from './sync/subscriptions';
import { fetchAndSyncInvoice, fetchAndSyncInvoices, syncInvoices } from './sync/invoices';
import { fetchAndSyncCreditNote, fetchAndSyncCreditNotes, syncCreditNotes } from './sync/credit_notes';
import { fetchAndSyncPlan, fetchAndSyncPlans } from './sync/plans';
import { getBillingCycleFromInvoice } from './invoice-utils';

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

  async sync(
    entity: 'invoices' | 'customers' | 'credit_notes' | 'subscriptions' | 'plans',
    params:
      | InvoicesFetchParams
      | CustomersFetchParams
      | CreditNotesFetchParams
      | SubscriptionsFetchParams
      | PlansFetchParams
  ): Promise<number> {
    switch (entity) {
      case 'invoices': {
        return fetchAndSyncInvoices(this.postgresClient, this.orb, params as InvoicesFetchParams);
      }
      case 'credit_notes': {
        return fetchAndSyncCreditNotes(this.postgresClient, this.orb, params as CreditNotesFetchParams);
      }
      case 'customers': {
        return fetchAndSyncCustomers(this.postgresClient, this.orb, params as CustomersFetchParams);
      }
      case 'subscriptions': {
        return fetchAndSyncSubscriptions(this.postgresClient, this.orb, params as SubscriptionsFetchParams);
      }
      case 'plans': {
        return fetchAndSyncPlans(this.postgresClient, this.orb, params as PlansFetchParams);
      }
    }
  }

  async processWebhook(payload: string, headers: HeadersLike | undefined) {
    if (this.config.verifyWebhookSignature ?? true) {
      this.orb.webhooks.verifySignature(payload, headers || {}, this.config.orbWebhookSecret);
    }

    const parsedData = JSON.parse(payload) as OrbWebhook;
    switch (parsedData.type) {
      // Test event, just ignore it
      case 'resource_event.test': {
        break;
      }
      case 'customer.created':
      case 'customer.edited':
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
      case 'subscription.fixed_fee_quantity_updated':
      case 'subscription.plan_version_change_scheduled':
      case 'subscription.plan_version_changed':
      case 'subscription.edited':
      case 'subscription.started': {
        await syncSubscriptions(this.postgresClient, [(parsedData as SubscriptionWebhook).subscription]);
        break;
      }
      case 'invoice.invoice_date_elapsed': {
        // Is being ignored because from 2024-09-20 the webhook payload only contains a "minified" version of the invoice resource.
        // We don't want to override invoice data with a minified version.
        break;
      }

      case 'invoice.issued': {
        const invoice = (parsedData as InvoiceWebhook).invoice;
        await syncInvoices(this.postgresClient, [invoice]);

        const billingCycle = getBillingCycleFromInvoice(invoice);
        if (billingCycle && invoice.subscription) {
          await updateBillingCycle(this.postgresClient, {
            subscriptionId: invoice.subscription.id,
            billingCycleStart: billingCycle.start,
            billingCycleEnd: billingCycle.end,
          });
        }

        break;
      }

      case 'invoice.edited':
      case 'invoice.manually_marked_as_void':
      case 'invoice.payment_failed':
      case 'invoice.issue_failed':
      case 'invoice.manually_marked_as_paid':
      case 'invoice.payment_processing':
      case 'invoice.sync_failed':
      case 'invoice.sync_succeded':
      case 'invoice.undo_mark_as_paid':
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

  async syncSingleEntity(entity: 'invoices' | 'customers' | 'credit_notes' | 'subscriptions' | 'plans', id: string) {
    switch (entity) {
      case 'invoices': {
        await fetchAndSyncInvoice(this.postgresClient, this.orb, id);
        break;
      }

      case 'credit_notes': {
        await fetchAndSyncCreditNote(this.postgresClient, this.orb, id);
        break;
      }

      case 'customers': {
        await fetchAndSyncCustomer(this.postgresClient, this.orb, id);
        break;
      }

      case 'subscriptions': {
        await fetchAndSyncSubscription(this.postgresClient, this.orb, id);
        break;
      }

      case 'plans': {
        await fetchAndSyncPlan(this.postgresClient, this.orb, id);
        break;
      }
    }
  }
}
