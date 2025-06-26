import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import path from 'node:path';
import pino from 'pino';
import fs from 'node:fs';
import { OrbSync, syncInvoices, syncSubscriptions } from 'orb-sync-lib';
import { createApp } from '../app';
import { fetchInvoicesFromDatabase, fetchBillingCyclesFromDatabase, deleteTestData } from './test-utils';
import type { Invoice, Subscription } from 'orb-billing/resources';

describe('POST /webhooks', () => {
  let app: FastifyInstance;
  let orbSync: OrbSync;

  beforeAll(async () => {
    const logger = pino({ level: 'silent' });

    // Create a OrbSync instance for integration testing
    orbSync = new OrbSync({
      databaseUrl: process.env.DATABASE_URL!,
      orbWebhookSecret: process.env.ORB_WEBHOOK_SECRET!,
      verifyWebhookSignature: false, // Disable signature verification for tests
      logger: logger.child({ component: 'orb-sync' }),
    });

    app = await createApp(
      {
        loggerInstance: logger,
        disableRequestLogging: true,
        requestIdHeader: 'Request-Id',
      },
      logger,
      orbSync
    );
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  function loadWebhookPayload(eventName: string): string {
    const fixturePath = path.join(__dirname, 'orb', `${eventName}.json`);
    return fs.readFileSync(fixturePath, 'utf-8');
  }

  function createWebhookHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'User-Agent': 'Orb-Webhook/1.0',
      'X-Orb-Signature': 'mock-signature',
      'X-Orb-Timestamp': new Date().toISOString(),
    };
  }

  async function sendWebhookRequest(payload: string) {
    return await app.inject({
      method: 'POST',
      url: '/webhooks',
      headers: createWebhookHeaders(),
      payload,
    });
  }

  it('should ignore invoice.invoice_date_elapsed webhook', async () => {
    let payload = loadWebhookPayload('invoice');

    const webhookData = JSON.parse(payload);
    webhookData.type = 'invoice.invoice_date_elapsed';
    payload = JSON.stringify(webhookData);

    const response = await sendWebhookRequest(payload);
    expect(response.statusCode).toBe(200);

    const data = response.json();
    expect(data).toMatchObject({
      received: true,
    });

    // Verify that the invoice was not created in the database
    const invoices = await fetchInvoicesFromDatabase(orbSync.postgresClient, ['invoice_id']);
    expect(invoices).toHaveLength(0);
  });

  it('should handle invoice.issued webhook and update the billing cycle dates', async () => {
    let payload = loadWebhookPayload('invoice');
    const postgresClient = orbSync.postgresClient;

    // Parse the payload and update billing cycle dates to sensible values
    const webhookData = JSON.parse(payload);
    const invoiceId = webhookData.invoice.id;
    const subscriptionId = webhookData.invoice.subscription?.id;
    const customerId = webhookData.invoice.customer.id;

    // As preparation, we delete the existing invoice and subscription if they exist
    await deleteTestData(orbSync.postgresClient, 'invoices', [invoiceId]);
    await deleteTestData(orbSync.postgresClient, 'subscriptions', [subscriptionId]);

    webhookData.type = 'invoice.issued';

    const now = new Date();
    const startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago
    const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    // Find and update the plan line item dates
    const planLineItem = webhookData.invoice.line_items.find(
      (item: Invoice.LineItem) =>
        item.price?.price_type === 'fixed_price' && item.price.billable_metric === null && item.name.endsWith('Plan')
    );

    planLineItem.start_date = startDate.toISOString();
    planLineItem.end_date = endDate.toISOString();

    // Update the payload with the modified data
    payload = JSON.stringify(webhookData);

    const subscriptionStartDate = new Date('2025-03-01T00:00:00.000Z');
    const subscriptionEndDate = new Date('2025-04-01T00:00:00.000Z');

    // Create a test subscription. The billing cycle dates should be updated by the webhook.
    const testSubscription = {
      id: subscriptionId,
      customer: { id: customerId },
      status: 'active',
      created_at: subscriptionStartDate.toISOString(),
      start_date: subscriptionStartDate.toISOString(),
      current_billing_period_start_date: subscriptionStartDate.toISOString(),
      current_billing_period_end_date: subscriptionEndDate.toISOString(),
      billing_cycle_day: 8,
      net_terms: 0,
      metadata: {},
    } as Subscription;

    await syncSubscriptions(postgresClient, [testSubscription]);

    const response = await sendWebhookRequest(payload);
    expect(response.statusCode).toBe(200);

    // Verify that the invoice was created in the database
    const [invoice] = await fetchInvoicesFromDatabase(orbSync.postgresClient, [invoiceId]);
    expect(invoice).toBeDefined();

    // Verify that billing cycle was updated if subscription exists and has a plan line item
    const billingCycles = await fetchBillingCyclesFromDatabase(orbSync.postgresClient, subscriptionId);
    expect(billingCycles).toHaveLength(1);
    const billingCycle = billingCycles[0];

    // Verify that the billing cycle dates are not the same as the start and end dates
    expect(billingCycle.current_billing_period_start_date).not.toBe(subscriptionStartDate.toISOString());
    expect(new Date(billingCycle.current_billing_period_start_date).getTime()).toBeGreaterThan(
      subscriptionStartDate.getTime()
    );
    expect(billingCycle.current_billing_period_end_date).not.toBe(subscriptionEndDate.toISOString());
    expect(new Date(billingCycle.current_billing_period_end_date).getTime()).toBeGreaterThan(
      subscriptionEndDate.getTime()
    );

    // Verify that the billing cycle dates are valid dates
    expect(new Date(billingCycle.current_billing_period_start_date).getTime()).not.toBeNaN();
    expect(new Date(billingCycle.current_billing_period_end_date).getTime()).not.toBeNaN();

    // Verify that the billing cycle start date is before the end date
    expect(new Date(billingCycle.current_billing_period_start_date).getTime()).toBeLessThan(
      new Date(billingCycle.current_billing_period_end_date).getTime()
    );
  });

  it.each([
    'invoice.edited',
    'invoice.manually_marked_as_void',
    'invoice.payment_failed',
    'invoice.issue_failed',
    'invoice.manually_marked_as_paid',
    'invoice.payment_processing',
    'invoice.sync_failed',
    'invoice.sync_succeded',
    'invoice.undo_mark_as_paid',
    'invoice.payment_succeeded',
  ])('should handle %s webhook and create an invoice', async (webhookType) => {
    let payload = loadWebhookPayload('invoice');

    const webhookData = JSON.parse(payload);
    webhookData.type = webhookType;
    payload = JSON.stringify(webhookData);

    const invoiceId = webhookData.invoice.id;

    // Delete the invoice from the database if it exists
    await deleteTestData(orbSync.postgresClient, 'invoices', [invoiceId]);

    const response = await sendWebhookRequest(payload);
    expect(response.statusCode).toBe(200);

    // Verify that the invoice was created in the database
    const [invoice] = await fetchInvoicesFromDatabase(orbSync.postgresClient, [invoiceId]);
    expect(invoice).toBeDefined();
    expect(invoice.invoice_number).toBe(webhookData.invoice.invoice_number);
    expect(invoice.customer_id).toBe(webhookData.invoice.customer.id);
    expect(invoice.total).toBe(webhookData.invoice.amount_due);
    expect(invoice.currency).toBe(webhookData.invoice.currency);
    expect(invoice.status).toBe(webhookData.invoice.status);
  });

  it('should update an existing invoice when webhook arrives', async () => {
    let payload = loadWebhookPayload('invoice');
    const postgresClient = orbSync.postgresClient;

    const webhookData = JSON.parse(payload);
    const invoiceId = webhookData.invoice.id;
    await deleteTestData(orbSync.postgresClient, 'invoices', [invoiceId]);

    webhookData.type = 'invoice.payment_succeeded';

    // Create an initial invoice and store it in the database using the syncInvoices function
    const initialAmount = 1000;
    const initialStatus = 'pending';
    webhookData.invoice.amount_due = initialAmount.toString();
    webhookData.invoice.total = initialAmount.toString();
    webhookData.invoice.status = initialStatus;

    payload = JSON.stringify(webhookData);

    // Create initial invoice data
    const initialInvoiceData = {
      ...webhookData.invoice,
      amount_due: initialAmount.toString(),
      total: initialAmount.toString(),
      status: initialStatus,
    };

    // Store the initial invoice in the database
    await syncInvoices(postgresClient, [initialInvoiceData]);

    // Now update the webhook data with new values
    const updatedAmount = 1500;
    const updatedStatus = 'paid';
    webhookData.invoice.amount_due = updatedAmount.toString();
    webhookData.invoice.total = updatedAmount.toString();
    webhookData.invoice.status = updatedStatus;
    webhookData.invoice.paid_at = new Date().toISOString();

    payload = JSON.stringify(webhookData);

    // Send the webhook with updated data
    const response = await sendWebhookRequest(payload);
    expect(response.statusCode).toBe(200);

    const data = response.json();
    expect(data).toMatchObject({
      received: true,
    });

    // Verify that the invoice was updated in the database
    const [invoice] = await fetchInvoicesFromDatabase(orbSync.postgresClient, [invoiceId]);
    expect(invoice).toBeDefined();
    expect(Number(invoice.total)).toBe(updatedAmount);
    expect(invoice.status).toBe(updatedStatus);

    // Verify that the updated_at timestamp was changed
    expect(invoice.updated_at).toBeDefined();
    expect(new Date(invoice.updated_at).getTime()).toBeGreaterThan(new Date(webhookData.invoice.created_at).getTime());
  });
});
