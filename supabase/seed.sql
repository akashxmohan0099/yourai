-- Seed data for development
-- This creates a demo tenant with sample business data

-- Note: In development, create a user via Supabase Auth first,
-- then run this seed with that user's ID

-- Demo tenant
insert into public.tenants (id, name, slug, status)
values ('00000000-0000-0000-0000-000000000001', 'Demo Salon', 'demo-salon', 'active');

-- Demo business config
insert into public.business_config (tenant_id, business_name, industry, description, phone, email, timezone, tone, hours, faqs)
values (
  '00000000-0000-0000-0000-000000000001',
  'Demo Salon',
  'Beauty & Wellness',
  'A friendly neighborhood salon offering cuts, color, and styling for all.',
  '(555) 123-4567',
  'hello@demosalon.com',
  'America/New_York',
  'friendly',
  '{"monday": {"open": "09:00", "close": "18:00"}, "tuesday": {"open": "09:00", "close": "18:00"}, "wednesday": {"open": "09:00", "close": "18:00"}, "thursday": {"open": "09:00", "close": "20:00"}, "friday": {"open": "09:00", "close": "18:00"}, "saturday": {"open": "10:00", "close": "16:00"}, "sunday": null}',
  '[{"question": "Do you take walk-ins?", "answer": "We accept walk-ins based on availability, but we recommend booking in advance to guarantee your preferred time."}, {"question": "What forms of payment do you accept?", "answer": "We accept cash, all major credit cards, Apple Pay, and Google Pay."}]'
);

-- Demo services
insert into public.services (tenant_id, name, description, category, price_cents, price_type, duration_minutes, sort_order) values
  ('00000000-0000-0000-0000-000000000001', 'Haircut', 'Classic haircut with wash and style', 'Cuts', 4500, 'fixed', 45, 1),
  ('00000000-0000-0000-0000-000000000001', 'Color Treatment', 'Full color service with premium products', 'Color', 12000, 'starting_at', 90, 2),
  ('00000000-0000-0000-0000-000000000001', 'Blowout', 'Wash and blowout styling', 'Styling', 3500, 'fixed', 30, 3),
  ('00000000-0000-0000-0000-000000000001', 'Highlights', 'Partial or full highlights', 'Color', 15000, 'starting_at', 120, 4),
  ('00000000-0000-0000-0000-000000000001', 'Deep Conditioning', 'Intensive conditioning treatment', 'Treatments', 2500, 'fixed', 20, 5);
