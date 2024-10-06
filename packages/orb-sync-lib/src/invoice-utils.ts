import { Invoice } from 'orb-billing/resources';

const PLAN_LINE_ITEM_NAME_ENDS_IN = 'Plan';

/**
 * Returns the billing cycle the given invoice's plan line item applies to.
 * If no plan line item is present, null is returned.
 */
export function getBillingCycleFromInvoice(invoice: Invoice): { start: string; end: string } | null {
  const planLineItem = findPlanLineItem(invoice.line_items);

  // No plan line item found.
  // Is the case for e.g. invoices that include usage line items for the past billing cycle only or
  // invoices that include a fixed price line item other than the plan line item only
  if (!planLineItem) {
    return null;
  }

  return {
    start: planLineItem.start_date,
    end: planLineItem.end_date,
  };
}

function findPlanLineItem(lineItems: Invoice.LineItem[]): Invoice.LineItem | undefined {
  return lineItems.find(
    (item) =>
      item.price?.price_type === 'fixed_price' &&
      item.price.billable_metric === null &&
      item.name.endsWith(PLAN_LINE_ITEM_NAME_ENDS_IN)
  );
}
