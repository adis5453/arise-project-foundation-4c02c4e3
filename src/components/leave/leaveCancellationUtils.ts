// Leave Cancellation Utility
// Add this to your LeaveManagement component

import { toast } from 'sonner';
import DatabaseService from '../../services/databaseService';

export interface CancelLeaveProps {
    leaveId: string;
    employeeName: string;
    days: number;
    onSuccess: () => void;
}

export const cancelLeaveRequest = async (
    leaveId: string,
    cancellationReason: string
): Promise<any> => {
    try {
        return await DatabaseService.cancelLeaveRequest(leaveId, cancellationReason);
    } catch (error: any) {
        throw error;
    }
};

export const handleCancelLeave = async (
    leaveId: string,
    employeeName: string,
    days: number,
    onSuccess: () => void
) => {
    const reason = window.prompt(
        `Cancel approved leave for ${employeeName}?\n\nThis will restore ${days} day(s) to their balance.\n\nPlease enter cancellation reason:`
    );

    if (!reason || reason.trim() === '') {
        toast.error('Cancellation reason is required');
        return;
    }

    try {
        const result = await cancelLeaveRequest(leaveId, reason.trim());

        toast.success(
            `Leave cancelled successfully! ${result.balance_restored} day(s) restored to balance`,
            { duration: 5000 }
        );

        onSuccess();
    } catch (error: any) {
        toast.error(error.message || 'Failed to cancel leave');
    }
};
