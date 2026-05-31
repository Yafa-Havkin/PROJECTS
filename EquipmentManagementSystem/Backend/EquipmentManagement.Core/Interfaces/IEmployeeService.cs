using EquipmentManagement.Core.DTOs;

namespace EquipmentManagement.Core.Interfaces;

public interface IEmployeeService
{
    Task<List<LoanDto>> GetCurrentLoansAsync(int employeeId);
    Task<List<LoanDto>> GetLoanHistoryAsync(int employeeId);
}
