create
or replace function orb.set_updated_at () returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return NEW;
end;
$$;

alter function orb.set_updated_at () owner to postgres;

alter table orb.subscriptions
add updated_at timestamptz default timezone ('utc'::text, now()) not null;

create trigger handle_updated_at before
update on orb.subscriptions for each row
execute function orb.set_updated_at ();

alter table orb.customers
add updated_at timestamptz default timezone ('utc'::text, now()) not null;

create trigger handle_updated_at before
update on orb.customers for each row
execute function orb.set_updated_at ();

alter table orb.invoices
add updated_at timestamptz default timezone ('utc'::text, now()) not null;

create trigger handle_updated_at before
update on orb.invoices for each row
execute function orb.set_updated_at ();

alter table orb.credit_notes
add updated_at timestamptz default timezone ('utc'::text, now()) not null;

create trigger handle_updated_at before
update on orb.credit_notes for each row
execute function orb.set_updated_at ();