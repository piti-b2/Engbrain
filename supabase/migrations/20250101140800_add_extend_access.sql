-- Create function to extend course access
CREATE OR REPLACE FUNCTION extend_course_access(
  p_user_id TEXT,
  p_course_id TEXT,
  p_package_id INTEGER,
  p_duration_days INTEGER,
  p_daily_limit INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_access_id INTEGER;
  v_current_expiry TIMESTAMP;
  v_new_expiry TIMESTAMP;
BEGIN
  -- Get current active access
  SELECT id, expiry_date 
  INTO v_current_access_id, v_current_expiry
  FROM course_access
  WHERE user_id = p_user_id 
    AND course_id = p_course_id
    AND status = 'ACTIVE'
    AND access_type = 'PREMIUM'
  ORDER BY expiry_date DESC
  LIMIT 1;

  -- If no active access found, return false
  IF v_current_access_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Calculate new expiry date
  -- If current access is expired, start from now
  -- If not expired, add days to current expiry
  IF v_current_expiry < NOW() THEN
    v_new_expiry := NOW() + (p_duration_days || ' days')::INTERVAL;
  ELSE
    v_new_expiry := v_current_expiry + (p_duration_days || ' days')::INTERVAL;
  END IF;

  -- Update current access
  UPDATE course_access
  SET 
    expiry_date = v_new_expiry,
    daily_limit = p_daily_limit,
    package_id = p_package_id,
    updated_at = NOW()
  WHERE id = v_current_access_id;

  RETURN TRUE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION extend_course_access TO authenticated;
GRANT EXECUTE ON FUNCTION extend_course_access TO service_role;
