-- Add coming_soon column to subscription_plans table
-- This allows admins to mark plans as "Coming Soon" in the UI

ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS coming_soon BOOLEAN DEFAULT FALSE;

-- Add comment to explain the column
COMMENT ON COLUMN subscription_plans.coming_soon IS 'When true, plan will show in UI with "Coming Soon" button instead of "Subscribe Now"';

-- Example: Mark a plan as coming soon
-- UPDATE subscription_plans SET coming_soon = TRUE WHERE name = 'Premium Plan';
