create table
    if not exists orb.billable_metrics (
        id text primary key,
        name text not null,
        description text,
        status text not null,
        item_id text,
        metadata jsonb,
        created_at timestamp not null default now ()
    );

create index if not exists orb_billable_metric_item_id_idx on orb.billable_metrics (item_id);