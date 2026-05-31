using EquipmentManagement.Core.DTOs;
using EquipmentManagement.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace EquipmentManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EmployeesController : ControllerBase
{
    private readonly IEmployeeService _employeeService;

    public EmployeesController(IEmployeeService employeeService)
    {
        _employeeService = employeeService;
    }

    [HttpGet("{id}/current-loans")]
    public async Task<ActionResult<List<LoanDto>>> GetCurrentLoans(int id)
    {
        var loans = await _employeeService.GetCurrentLoansAsync(id);
        return Ok(loans);
    }

    [HttpGet("{id}/loan-history")]
    public async Task<ActionResult<List<LoanDto>>> GetLoanHistory(int id)
    {
        var loans = await _employeeService.GetLoanHistoryAsync(id);
        return Ok(loans);
    }
}
