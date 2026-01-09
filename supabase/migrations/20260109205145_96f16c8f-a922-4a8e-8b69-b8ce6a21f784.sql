-- Allow authenticated users to read default settings
CREATE POLICY "Authenticated users can view default settings"
ON admin_settings FOR SELECT
USING (auth.uid() IS NOT NULL);