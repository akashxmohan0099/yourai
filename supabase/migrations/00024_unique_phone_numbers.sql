-- Ensure one phone number can only be associated with one tenant
-- This prevents accidentally assigning the same Twilio or Vapi number to multiple accounts

CREATE UNIQUE INDEX IF NOT EXISTS idx_business_config_twilio_phone_unique
  ON business_config (twilio_phone_number)
  WHERE twilio_phone_number IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_business_config_vapi_phone_unique
  ON business_config (vapi_phone_number_id)
  WHERE vapi_phone_number_id IS NOT NULL;
