using EquipmentManagement.Core.DTOs;
using EquipmentManagement.Core.Entities;
using EquipmentManagement.Core.Interfaces;
using EquipmentManagement.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EquipmentManagement.Services.Services;

public class LoanService : ILoanService
{
    private readonly ApplicationDbContext _context;

    public LoanService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<LoanDto>> GetActiveLoansAsync()
    {
        return await _context.Loans
            .Include(l => l.Equipment)
            .Include(l => l.Employee)
            .Include(l => l.Manager)
            .Where(l => l.Status == "Approved")
            .Select(l => new LoanDto
            {
                Id = l.Id,
                EquipmentId = l.EquipmentId,
                EquipmentName = l.Equipment!.Name,
                EmployeeId = l.EmployeeId,
                EmployeeName = l.Employee!.Name,
                ManagerId = l.ManagerId,
                ManagerName = l.Manager!.Name,
                Status = l.Status
            })
            .ToListAsync();
    }

    public async Task<ServiceResult<LoanDto>> CreateLoanAsync(CreateLoanDto dto)
    {
        var equipment = await _context.Equipment.FindAsync(dto.EquipmentId);
        if (equipment == null)
            return ServiceResult<LoanDto>.FailureResult("Equipment not found");

        var employee = await _context.Employees.FindAsync(dto.EmployeeId);
        if (employee == null)
            return ServiceResult<LoanDto>.FailureResult("Employee not found");

        var manager = await _context.Employees.FindAsync(dto.ManagerId);
        if (manager == null)
            return ServiceResult<LoanDto>.FailureResult("Manager not found");

        var loan = new Loan
        {
            EquipmentId = dto.EquipmentId,
            EmployeeId = dto.EmployeeId,
            ManagerId = dto.ManagerId,
            Status = "Approved"
        };

        equipment.Status = "Loaned";

        _context.Loans.Add(loan);
        await _context.SaveChangesAsync();

        var loanDto = new LoanDto
        {
            Id = loan.Id,
            EquipmentId = loan.EquipmentId,
            EquipmentName = equipment.Name,
            EmployeeId = loan.EmployeeId,
            EmployeeName = employee.Name,
            ManagerId = loan.ManagerId,
            ManagerName = manager.Name,
            Status = loan.Status
        };

        return ServiceResult<LoanDto>.SuccessResult(loanDto);
    }

    public async Task<ServiceResult<bool>> ReturnLoanAsync(int loanId)
    {
        var loan = await _context.Loans
            .Include(l => l.Equipment)
            .FirstOrDefaultAsync(l => l.Id == loanId);

        if (loan == null)
            return ServiceResult<bool>.FailureResult("Loan not found");

        loan.Status = "Returned";
        loan.Equipment!.Status = "Available";

        await _context.SaveChangesAsync();

        return ServiceResult<bool>.SuccessResult(true);
    }
}
