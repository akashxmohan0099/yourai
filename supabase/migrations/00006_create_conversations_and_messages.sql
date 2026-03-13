create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  channel text not null default 'web_chat' check (channel in ('web_chat', 'voice', 'sms', 'whatsapp', 'email')),
  status text not null default 'active' check (status in ('active', 'resolved', 'escalated', 'archived')),
  subject text,
  metadata jsonb default '{}',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_conversations_tenant on public.conversations(tenant_id);
create index idx_conversations_client on public.conversations(client_id);
create index idx_conversations_status on public.conversations(tenant_id, status);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system', 'tool')),
  content text not null,
  metadata jsonb default '{}',
  channel_message_id text,
  created_at timestamptz not null default now()
);

create index idx_messages_conversation on public.messages(conversation_id);
create index idx_messages_tenant on public.messages(tenant_id);

-- Enable realtime for conversations and messages
alter publication supabase_realtime add table public.conversations;
alter publication supabase_realtime add table public.messages;
