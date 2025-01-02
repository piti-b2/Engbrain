-- Drop existing policies if any
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON "public"."course_access";
DROP POLICY IF EXISTS "Enable update for authenticated users" ON "public"."course_access";
DROP POLICY IF EXISTS "Enable select for authenticated users" ON "public"."course_access";

-- Create specific policies for each operation
CREATE POLICY "Enable insert for authenticated users" 
ON "public"."course_access"
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Enable update for authenticated users" 
ON "public"."course_access"
FOR UPDATE
TO authenticated
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Enable select for authenticated users" 
ON "public"."course_access"
FOR SELECT
TO authenticated
USING (auth.uid()::text = user_id);

-- Function to extend course access
CREATE OR REPLACE FUNCTION public.extend_course_access_v2(
    p_user_id TEXT,
    p_course_id TEXT,
    p_package_id INTEGER,
    p_duration_days INTEGER,
    p_daily_limit INTEGER
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_access RECORD;
    v_new_expiry TIMESTAMP;
BEGIN
    -- Verify the user has permission
    IF NOT (SELECT EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id::text = p_user_id 
        AND id::text = auth.uid()::text
    )) THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

    -- Get current active access
    SELECT *
    INTO v_current_access
    FROM course_access
    WHERE user_id = p_user_id
    AND course_id = p_course_id
    AND access_type = 'PREMIUM'
    AND status = 'ACTIVE'
    ORDER BY expiry_date DESC
    LIMIT 1;

    -- If no active access found, return false
    IF v_current_access IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Calculate new expiry date
    IF v_current_access.expiry_date < NOW() THEN
        -- If expired, start from now
        v_new_expiry := NOW() + (p_duration_days || ' days')::INTERVAL;
    ELSE
        -- If not expired, add to current expiry
        v_new_expiry := v_current_access.expiry_date + (p_duration_days || ' days')::INTERVAL;
    END IF;

    -- Update the access
    UPDATE course_access
    SET expiry_date = v_new_expiry,
        daily_limit = p_daily_limit,
        package_id = p_package_id,
        updated_at = NOW()
    WHERE id = v_current_access.id
    AND user_id = p_user_id;  -- Additional security check

    RETURN TRUE;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.extend_course_access_v2 TO authenticated;
GRANT EXECUTE ON FUNCTION public.extend_course_access_v2 TO service_role;

-- Enable RLS
ALTER TABLE public.course_access ENABLE ROW LEVEL SECURITY;
