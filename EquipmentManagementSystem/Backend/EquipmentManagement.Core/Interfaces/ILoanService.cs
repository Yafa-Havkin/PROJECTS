using EquipmentManagement.Core.DTOs;

namespace EquipmentManagement.Core.Interfaces;

public interface ILoanService
{
    Task<List<LoanDto>> GetActiveLoansAsync();
    Task<ServiceResult<LoanDto>> CreateLoanAsync(CreateLoanDto dto);
    Task<ServiceResult<bool>> ReturnLoanAsync(int loanId);
}
