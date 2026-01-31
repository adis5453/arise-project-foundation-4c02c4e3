-- Migration: Add Leave Cancellation Support
-- Date: 2025-12-17
-- Purpose: Enable team leaders and higher roles to cancel approved leaves

-- Add cancellation fields to leave_requests table
ALTER TABLE leave_requests
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES user_profiles(id),
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_leave_requests_cancelled_by ON leave_requests(cancelled_by);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);

-- Add comment for documentation
COMMENT ON COLUMN leave_requests.cancelled_at IS 'Timestamp when leave was cancelled';
COMMENT ON COLUMN leave_requests.cancelled_by IS 'User who cancelled the approved leave';
COMMENT ON COLUMN leave_requests.cancellation_reason IS 'Reason for cancelling approved leave';

-- Optional: Create audit log table for tracking all leave actions
CREATE TABLE IF NOT EXISTS leave_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    leave_request_id UUID REFERENCES leave_requests(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- 'requested', 'approved', 'rejected', 'cancelled'
    performed_by UUID REFERENCES user_profiles(id),
    action_reason TEXT,
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for audit log
CREATE INDEX IF NOT EXISTS idx_leave_audit_request ON leave_audit_log(leave_request_id);
CREATE INDEX IF NOT EXISTS idx_leave_audit_performer ON leave_audit_log(performed_by);
CREATE INDEX IF NOT EXISTS idx_leave_audit_created ON leave_audit_log(created_at DESC);

-- Add comment
COMMENT ON TABLE leave_audit_log IS 'Audit trail for all leave request actions';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Leave cancellation migration completed successfully';
END $$;
