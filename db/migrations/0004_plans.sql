create type orb.plan_status as enum('active', 'archived', 'draft');

create table if not exists
    orb.plans (
        id varchar(255) primary key,
        name text,
        description text,
        maximum_amount text,
        minimum_amount text,
        created_at timestamp not null,
        status orb.plan_status,
        maximum jsonb,
        minimum jsonb,
        discount jsonb,
        product jsonb,
        version integer,
        trial_config jsonb,
        plan_phases json,
        base_plan jsonb,
        base_plan_id text,
        external_plan_id text,
        currency text,
        invoicing_currency text,
        net_terms integer,
        default_invoice_memo text,
        prices json,
        metadata jsonb,
        updated_at timestamptz default timezone ('utc'::text, now()) not null
    );


create trigger handle_updated_at before
update on orb.plans for each row
execute function orb.set_updated_at ();

create index if not exists plans_external_plan_id_idx on orb.plans (external_plan_id);