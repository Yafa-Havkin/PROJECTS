using EquipmentManagement.Core.DTOs;
using EquipmentManagement.Core.Interfaces;
using EquipmentManagement.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EquipmentManagement.Services.Services;

public class EmployeeService : IEmployeeService
{
    private readonly ApplicationDbContext _context;

    public EmployeeService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<LoanDto>> GetCurrentLoansAsync(int employeeId)
    {
        return await _context.Loans
            .Include(l => l.Equipment)
            .Include(l => l.Employee)
            .Include(l => l.Manager)
            .Where(l => l.EmployeeId == employeeId && l.Status == "Approved")
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

    public async Task<List<LoanDto>> GetLoanHistoryAsync(int employeeId)
    {
        return await _context.Loans
            .Include(l => l.Equipment)
            .Include(l => l.Employee)
            .Include(l => l.Manager)
            .Where(l => l.EmployeeId == employeeId)
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
}
