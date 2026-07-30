-- Séquence de relance des leads : le scan génère le lead, la relance génère le call.
-- C'est ici que se joue le taux de conversion scan → rendez-vous.

create table follow_ups (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  step int not null,                    -- 1 = J+2, 2 = J+7, 3 = J+21
  subject text not null,
  body text not null,
  scheduled_for date not null,
  status text not null default 'draft', -- draft | sent | replied | skipped
  sent_at timestamptz,
  created_at timestamptz not null default now()
);
create index follow_ups_lead_idx on follow_ups (lead_id);
create index follow_ups_due_idx on follow_ups (status, scheduled_for);

-- Traçabilité du dernier contact (priorisation des rappels dans l'admin)
alter table leads add column if not exists last_contacted_at timestamptz;
alter table leads add column if not exists call_booked_at timestamptz;
