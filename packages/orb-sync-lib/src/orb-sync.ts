import Orb from 'orb-billing';
import type { HeadersLike } from 'orb-billing/core';
import type {
  BillableMetricsFetchParams,
  CreditNotesFetchParams,
  CreditNoteWebhook,
  CustomersFetchParams,
  CustomerWebhook,
  InvoicesFetchParams,
  InvoiceWebhook,
  OrbWebhook,
  PlansFetchParams,
  SubscriptionCostExceededWebhook,
  SubscriptionsFetchParams,
  SubscriptionUsageExceededWebhook,
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
import { syncSubscriptionUsageExceeded } from './sync/subscription_usage_exceeded';
import { syncSubscriptionCostExceeded } from './sync/subscription_cost_exceeded';
import { fetchAndSyncBillableMetric, fetchAndSyncBillableMetrics } from './sync/billable_metrics';
import pino from 'pino';

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

  logger?: pino.Logger;
};

export class OrbSync {
  private orb: Orb;
  postgresClient: PostgresClient;

  constructor(private config: OrbSyncConfig) {
    this.orb = new Orb({ apiKey: config.orbApiKey, webhookSecret: config.orbWebhookSecret });
    this.postgresClient = new PostgresClient({
      databaseUrl: config.databaseUrl,
      schema: config.databaseSchema || 'orb',
    });
  }

  async sync(
    entity: 'invoices' | 'customers' | 'credit_notes' | 'subscriptions' | 'plans' | 'billable_metrics',
    params:
      | InvoicesFetchParams
      | CustomersFetchParams
      | CreditNotesFetchParams
      | SubscriptionsFetchParams
      | PlansFetchParams
      | BillableMetricsFetchParams
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
      case 'billable_metrics': {
        return fetchAndSyncBillableMetrics(this.postgresClient, this.orb, params as BillableMetricsFetchParams);
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
      // Data export events, just ignore them
      case 'data_exports.transfer_success':
      case 'data_exports.transfer_error': {
        break;
      }
      // Ignore accounting sync webhooks for now in the sync engine, given they just add unnecessary writes/load
      case 'customer.accounting_sync_failed':
      case 'customer.accounting_sync_succeeded':
      case 'credit_note.accounting_sync_failed':
      case 'credit_note.accounting_sync_succeeded':
      case 'invoice.accounting_sync_failed':
      case 'invoice.accounting_sync_succeeded': {
        break;
      }
      case 'customer.created':
      case 'customer.edited':
      case 'customer.credit_balance_depleted':
      case 'customer.credit_balance_recovered':
      case 'customer.credit_balance_dropped': {
        const webhook = parsedData as CustomerWebhook;

        this.config.logger?.info(`Received webhook ${webhook.id}: ${webhook.type} for customer ${webhook.customer.id}`);

        await syncCustomers(this.postgresClient, [webhook.customer], webhook.created_at);
        break;
      }
      case 'customer.balance_transaction_created': {
        const webhook = parsedData as CustomerWebhook;

        // Orb ocassionally sends multiple credit notes with the same timestamp at roughly the same time - this leads to possibly persisting an old customer balance
        // To prevent this, we will query the Orb customer via API to get the latest state
        const customer = await this.orb.customers.fetch(webhook.customer.id);

        await syncCustomers(this.postgresClient, [customer], new Date().toISOString());
        break;
      }
      case 'subscription.cancellation_scheduled':
      case 'subscription.cancellation_unscheduled':
      case 'subscription.plan_change_scheduled':
      case 'subscription.created':
      case 'subscription.ended':
      case 'subscription.plan_changed':
      case 'subscription.fixed_fee_quantity_updated':
      case 'subscription.plan_version_change_scheduled':
      case 'subscription.plan_version_changed':
      case 'subscription.edited':
      case 'subscription.started': {
        const webhook = parsedData as SubscriptionWebhook;
        this.config.logger?.info(
          `Received webhook ${webhook.id}: ${webhook.type} for subscription ${webhook.subscription.id}`
        );

        await syncSubscriptions(this.postgresClient, [webhook.subscription], webhook.created_at);
        break;
      }

      case 'subscription.usage_exceeded': {
        const webhook = parsedData as SubscriptionUsageExceededWebhook;

        this.config.logger?.info(
          `Received webhook ${webhook.id}: ${webhook.type} for subscription ${webhook.subscription.id}`
        );

        await syncSubscriptionUsageExceeded(this.postgresClient, webhook);
        break;
      }

      case 'subscription.cost_exceeded': {
        const webhook = parsedData as SubscriptionCostExceededWebhook;

        this.config.logger?.info(
          `Received webhook ${webhook.id}: ${webhook.type} for subscription ${webhook.subscription.id}`
        );

        await syncSubscriptionCostExceeded(this.postgresClient, webhook);
        break;
      }

      case 'invoice.invoice_date_elapsed': {
        // Is being ignored because from 2024-09-20 the webhook payload only contains a "minified" version of the invoice resource.
        // We don't want to override invoice data with a minified version.
        break;
      }

      case 'invoice.issued': {
        const webhook = parsedData as InvoiceWebhook;
        const invoice = webhook.invoice;
        this.config.logger?.info(`Received webhook ${webhook.id}: ${parsedData.type} for invoice ${invoice.id}`);

        await syncInvoices(this.postgresClient, [invoice], webhook.created_at);

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
        const webhook = parsedData as InvoiceWebhook;

        this.config.logger?.info(`Received webhook ${webhook.id}: ${webhook.type} for invoice ${webhook.invoice.id}`);

        await syncInvoices(this.postgresClient, [webhook.invoice], webhook.created_at);
        break;
      }

      case 'credit_note.issued':
      case 'credit_note.marked_as_void': {
        const webhook = parsedData as CreditNoteWebhook;
        this.config.logger?.info(
          `Received webhook ${webhook.id}: ${webhook.type} for credit note ${webhook.credit_note.id}`
        );

        await syncCreditNotes(this.postgresClient, [webhook.credit_note], webhook.created_at);
        break;
      }

      case 'billable_metric.edited': {
        this.config.logger?.info(`Received webhook ${parsedData.id}: ${parsedData.type} for billable metric`);

        // The billable metric webhook does not contain the ID, so we do a full refresh of all billable metrics
        await fetchAndSyncBillableMetrics(this.postgresClient, this.orb, { limit: 50 });
        break;
      }

      default: {
        throw new Error(`Unsupported webhook event type: ${parsedData.type}`);
      }
    }
  }

  async syncSingleEntity(
    entity: 'invoices' | 'customers' | 'credit_notes' | 'subscriptions' | 'plans' | 'billable_metrics',
    id: string
  ) {
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

      case 'billable_metrics': {
        await fetchAndSyncBillableMetric(this.postgresClient, this.orb, id);
        break;
      }
    }
  }
}
