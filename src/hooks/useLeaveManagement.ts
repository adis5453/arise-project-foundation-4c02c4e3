import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import {
  LeaveRequest,
  LeaveType,
  LeaveStats,
  LeaveAnalyticsData,
  LeaveRequestFilters,
  PaginatedResponse,
  PaginationParams,
  leaveQueryKeys
} from '../components/leave/types';
import DatabaseService from '../services/databaseService';
import { toast } from 'sonner';

export const useLeaveRequests = (
  filters: LeaveRequestFilters = {},
  pagination: PaginationParams = { page: 1, page_size: 10 },
  options?: Omit<UseQueryOptions<PaginatedResponse<LeaveRequest>, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: leaveQueryKeys.list({ ...filters, ...pagination }),
    queryFn: async () => {
      // In a real implementation we would pass pagination to the API
      // For now we fetch all matching filters and paginate client side if API doesn't support it fully
      const allRequests = await DatabaseService.getLeaveRequests({
        employeeId: filters.employee_id,
        status: filters.status,
        startDate: filters.start_date,
        endDate: filters.end_date
      });

      // Filter by type if needed (client side)
      let filteredData = allRequests;
      if (filters.leave_type_id?.length) {
        filteredData = filteredData.filter((request: any) =>
          request.leave_type_id && filters.leave_type_id?.includes(request.leave_type_id)
        );
      }

      // Sort
      if (pagination.sort_by) {
        const [sortField, sortOrder] = pagination.sort_by.split(':');
        filteredData.sort((a: any, b: any) => {
          if (a[sortField] < b[sortField]) return sortOrder === 'asc' ? -1 : 1;
          if (a[sortField] > b[sortField]) return sortOrder === 'asc' ? 1 : -1;
          return 0;
        });
      } else {
        filteredData.sort((a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }

      const total = filteredData.length;
      const from = (pagination.page - 1) * pagination.page_size;
      const to = from + pagination.page_size;
      const paginatedData = filteredData.slice(from, to);

      return {
        items: paginatedData,
        total,
        page: pagination.page,
        page_size: pagination.page_size,
        total_pages: Math.ceil(total / pagination.page_size)
      };
    },
    ...options
  });
};

export const useLeaveTypes = (options?: Omit<UseQueryOptions<LeaveType[]>, 'queryKey' | 'queryFn'>) => {
  return useQuery({
    queryKey: ['leaveTypes'],
    queryFn: async () => {
      const types = await DatabaseService.getLeaveTypes();
      return types;
    },
    ...options
  });
};

export const useLeaveBalances = (employeeId: string) => {
  return useQuery({
    queryKey: leaveQueryKeys.balances(employeeId),
    queryFn: async () => {
      const balances = await DatabaseService.getLeaveBalances(employeeId);
      return balances;
    }
  });
};

export interface EmployeeLeaveStats {
  total_leave_balance: number;
  total_approved_leave: number;
  pending_requests: number;
  upcoming_time_off: number;
  leave_utilization_percentage: number;
  leave_by_type: {
    leave_type_id: string;
    leave_type_name: string;
    balance: number;
    used: number;
  }[];
}

export const useLeaveStats = (employeeId: string) => {
  return useQuery<EmployeeLeaveStats>({
    queryFn: async () => {
      const [balances, requests] = await Promise.all([
        DatabaseService.getLeaveBalances(employeeId),
        DatabaseService.getLeaveRequests({ employeeId })
      ]);

      const totalApproved = requests
        .filter((r: any) => r.status === 'approved')
        .reduce((sum: number, req: any) => sum + (req.total_days || 0), 0);

      const pendingRequests = requests.filter((r: any) => r.status === 'pending').length;
      const upcomingTimeOff = requests
        .filter((r: any) => r.status === 'approved' && new Date(r.start_date) > new Date())
        .length;

      return {
        total_leave_balance: balances.reduce((sum: number, b: any) => sum + (b.available_balance || 0), 0),
        total_approved_leave: totalApproved,
        pending_requests: pendingRequests,
        upcoming_time_off: upcomingTimeOff,
        leave_utilization_percentage: 0,
        leave_by_type: balances.map((b: any) => ({
          leave_type_id: b.leave_type_id,
          leave_type_name: b.leave_type?.name || 'Unknown',
          balance: b.available_balance || 0,
          used: b.used_balance || 0
        }))
      };
    },
    queryKey: ['leaveStats', employeeId]
  });
};

export const useLeaveAnalytics = (params: any) => {
  return useQuery<LeaveAnalyticsData[]>({
    queryKey: ['leaveAnalytics', params],
    queryFn: async () => {
      // Return empty analytics for now until backend supports aggregation
      return [];
    }
  });
};

export const useCreateLeaveRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<LeaveRequest>) => {
      // Cast to expected type - validation handled by backend
      const res = await DatabaseService.createLeaveRequest(data as any);
      if (!res) throw new Error('Failed to create leave request');
      return res as unknown as LeaveRequest;
    },
    onSuccess: () => {
      toast.success('Leave request submitted successfully');
      queryClient.invalidateQueries({ queryKey: ['leave_requests'] });
      queryClient.invalidateQueries({ queryKey: ['leaveBalances'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to submit: ${error.message}`);
    }
  });
};

export const useUpdateLeaveRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LeaveRequest> & { id: string }) => {
      // We only support status update explicitly in DatabaseService, but let's assume updateLeaveRequest exists or we use status update
      // If it's just status:
      if (updates.status) {
        const res = await DatabaseService.updateLeaveRequestStatus(id, updates.status as string);
        return res as unknown as LeaveRequest;
      }
      throw new Error('Update not implemented for non-status fields');
    },
    onSuccess: (data) => {
      toast.success('Leave request updated');
      queryClient.invalidateQueries({ queryKey: ['leave_requests'] });
      queryClient.invalidateQueries({ queryKey: ['leaveBalances'] });
      if (data?.employee_id) {
        queryClient.invalidateQueries({ queryKey: ['leaveStats', data.employee_id] });
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to update: ${error.message}`);
    }
  });
};

export const useDeleteLeaveRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await DatabaseService.deleteLeaveRequest(id);
      return id;
    },
    onSuccess: (id) => {
      toast.success('Leave request deleted');
      queryClient.invalidateQueries({ queryKey: ['leave_requests'] });
      queryClient.removeQueries({ queryKey: ['leave_requests', id] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete: ${error.message}`);
    }
  });
};
