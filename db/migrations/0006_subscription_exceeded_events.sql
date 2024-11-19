create table
    if not exists orb.subscription_usage_exceeded (
        id BIGSERIAL primary key,
        billable_metric_id varchar(255) not null,
        subscription_id varchar(255) not null,
        customer_id varchar(255) not null,
        external_customer_id varchar(255),
        timeframe_start timestamp not null,
        timeframe_end timestamp not null,
        amount_threshold decimal not null,
        created_at timestamp not null default now()
    );

create index if not exists on orb_subscription_usage_exceeded_subscription_idx on orb.subscription_usage_exceeded (subscription_id);
create index if not exists on orb_subscription_usage_exceeded_customer_idx on orb.subscription_usage_exceeded (customer_id);
create index if not exists on orb_subscription_usage_exceeded_external_customer_idx on orb.subscription_usage_exceeded (external_customer_id);

create table
    if not exists orb.subscription_cost_exceeded (
        id BIGSERIAL primary key,
        subscription_id varchar(255) not null,
        customer_id varchar(255) not null,
        external_customer_id varchar(255),
        timeframe_start timestamp not null,
        timeframe_end timestamp not null,
        amount_threshold decimal not null,
        created_at timestamp not null default now()
    );


create index if not exists orb_subscription_cost_exceeded_subscription_idx on orb.subscription_cost_exceeded (subscription_id);
create index if not exists orb_subscription_cost_exceeded_customer_idx on orb.subscription_cost_exceeded (customer_id);
create index if not exists orb_subscription_cost_exceeded_external_customer_idx on orb.subscription_cost_exceeded (external_customer_id);
