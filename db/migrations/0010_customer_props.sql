alter table orb.customers add column "hierarchy" JSONB;
alter table orb.customers add column "automatic_tax_enabled" boolean;
alter table orb.customers add column "exempt_from_automated_tax" boolean;