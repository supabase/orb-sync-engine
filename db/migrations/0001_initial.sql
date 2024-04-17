create schema if not exists orb;

create table if not exists
    orb.customers (
        id varchar(255) primary key,
        additional_emails text[],
        auto_collection boolean not null,
        balance decimal not null,
        billing_address JSONB,
        shipping_address JSONB,
        created_at timestamp not null,
        currency varchar(255),
        email text,
        email_delivery boolean not null,
        external_customer_id text,
        metadata JSONB not null default '{}',
        name text,
        payment_provider varchar(255),
        payment_provider_id varchar(255),
        portal_url text,
        tax_id JSONB,
        timezone varchar(255) not null,
        accounting_sync_configuration JSONB,
        reporting_configuration JSONB
    );

create table if not exists
    orb.invoices (
        id varchar(255) primary key,
        amount_due decimal not null,
        auto_collection JSONB not null,
        billing_address JSONB,
        created_at timestamp not null,
        credit_notes JSONB,
        currency varchar(255) not null,
        customer_id varchar(255),
        customer_balance_transactions JSONB,
        customer_tax_id JSONB,
        discount JSONB,
        discounts JSONB,
        due_date timestamp,
        eligible_to_issue_at timestamp,
        hosted_invoice_url text,
        invoice_date timestamp not null,
        invoice_number text not null,
        invoice_pdf text,
        invoice_source varchar(255) not null,
        issue_failed_at timestamp,
        issued_at timestamp,
        line_items JSONB not null,
        maximum JSONB,
        maximum_amount decimal,
        memo text,
        metadata JSONB not null default '{}',
        minimum JSONB,
        minimum_amount decimal,
        paid_at timestamp,
        payment_failed_at timestamp,
        payment_started_at timestamp,
        scheduled_issue_at timestamp,
        shipping_address JSONB,
        status varchar(255) not null,
        subscription_id varchar(255),
        subtotal decimal,
        sync_failed_at timestamp,
        total decimal,
        voided_at timestamp,
        will_auto_issue boolean not null
    );

create table if not exists
    orb.subscriptions (
        id varchar(255) primary key,
        active_plan_phase_order int,
        auto_collection boolean,
        billing_cycle_day int not null,
        created_at timestamp not null,
        current_billing_period_end_date timestamp,
        current_billing_period_start_date timestamp,
        customer_id varchar(255),
        default_invoice_memo text,
        discount_intervals JSONB,
        end_date timestamp,
        fixed_fee_quantity_schedule JSONB,
        invoicing_threshold text,
        maximum_intervals JSONB,
        metadata JSONB not null default '{}',
        minimum_intervals JSONB,
        net_terms int not null,
        plan JSONB,
        plan_id varchar(255),
        price_intervals JSONB,
        redeemed_coupon JSONB,
        start_date timestamp not null,
        status varchar(255) not null,
        trial_info JSONB
    );

create table if not exists
    orb.credit_notes (
        id varchar(255) primary key,
        created_at timestamp not null,
        credit_note_number text not null,
        credit_note_pdf text,
        customer_id varchar(255),
        discounts jsonb not null default '[]',
        invoice_id varchar(255),
        line_items jsonb not null,
        maximum_amount_adjustment jsonb,
        memo text,
        minimum_amount_refunded decimal,
        reason varchar(255),
        subtotal decimal not null,
        total decimal not null,
        type varchar(255) not null,
        voided_at timestamp
    );

create index if not exists customers_email_idx on orb.customers (email);

create index if not exists customers_external_customer_id_idx on orb.customers (external_customer_id);

create index if not exists subscriptions_customer_id_idx on orb.subscriptions (customer_id);

create index if not exists invoices_subscription_id_idx on orb.invoices (subscription_id);

create index if not exists invoices_customer_id_idx on orb.invoices (customer_id);

create index if not exists credit_notes_customer_id_idx on orb.credit_notes (customer_id);