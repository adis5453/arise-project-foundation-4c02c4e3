import DatabaseService from '../../services/databaseService';
import RealDataService from '../../services/realDataService';

/**
 * Test the database fixes for count operations
 */
export async function testDatabaseFixes() {
  try {
    // Test 1: Dashboard metrics
    const dashboardMetrics = await DatabaseService.getDashboardMetrics();
    // Test 2: Employee stats
    const employeeStats = await RealDataService.getEmployeeStats();
    // Test 3: Individual count methods
    const [totalEmp, activeEmp, deptCount] = await Promise.all([
      DatabaseService.getEmployeeCount(),
      DatabaseService.getActiveEmployeeCount(),
      DatabaseService.getDepartmentCount()
    ]);

    return true;

  } catch (error) {
    return false;
  }
}

// Manual test function - call testDatabaseFixes() to verify fixes
// Auto-run disabled to avoid conflicts with other tests

export default testDatabaseFixes;
