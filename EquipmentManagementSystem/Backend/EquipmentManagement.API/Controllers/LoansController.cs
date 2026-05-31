using EquipmentManagement.Core.DTOs;
using EquipmentManagement.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace EquipmentManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LoansController : ControllerBase
{
    private readonly ILoanService _loanService;

    public LoansController(ILoanService loanService)
    {
        _loanService = loanService;
    }

    [HttpGet("active")]
    public async Task<ActionResult<List<LoanDto>>> GetActiveLoans()
    {
        var loans = await _loanService.GetActiveLoansAsync();
        return Ok(loans);
    }

    [HttpPost]
    public async Task<ActionResult<LoanDto>> CreateLoan(CreateLoanDto dto)
    {
        var result = await _loanService.CreateLoanAsync(dto);

        if (!result.Success)
            return NotFound(result.ErrorMessage);

        return CreatedAtAction(nameof(GetActiveLoans), new { id = result.Data!.Id }, result.Data);
    }

    [HttpPut("{id}/return")]
    public async Task<IActionResult> ReturnLoan(int id)
    {
        var result = await _loanService.ReturnLoanAsync(id);

        if (!result.Success)
            return NotFound(result.ErrorMessage);

        return NoContent();
    }
}
