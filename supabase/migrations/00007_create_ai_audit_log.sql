create table public.ai_audit_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  event_type text not null check (event_type in ('tool_call', 'permission_check', 'error', 'model_response')),
  tool_name text,
  tool_input jsonb,
  tool_output jsonb,
  permission_result text,
  model_used text,
  tokens_in integer,
  tokens_out integer,
  latency_ms integer,
  error text,
  created_at timestamptz not null default now()
);

create index idx_audit_tenant on public.ai_audit_log(tenant_id);
create index idx_audit_conversation on public.ai_audit_log(conversation_id);
create index idx_audit_created on public.ai_audit_log(created_at);
