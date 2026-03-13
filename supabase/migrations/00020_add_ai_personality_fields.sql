-- Add AI personality and conversation style fields
alter table public.business_config
  add column if not exists conversation_style text,
  add column if not exists example_phrases text;
