using EquipmentManagement.Core.DTOs;
using EquipmentManagement.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace EquipmentManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EquipmentController : ControllerBase
{
    private readonly IEquipmentService _equipmentService;

    public EquipmentController(IEquipmentService equipmentService)
    {
        _equipmentService = equipmentService;
    }

    [HttpGet]
    public async Task<ActionResult<List<EquipmentDto>>> GetAllEquipment()
    {
        var equipment = await _equipmentService.GetAllEquipmentAsync();
        return Ok(equipment);
    }

    [HttpGet("available")]
    public async Task<ActionResult<List<EquipmentDto>>> GetAvailableEquipment()
    {
        var equipment = await _equipmentService.GetAvailableEquipmentAsync();
        return Ok(equipment);
    }

    [HttpPost]
    public async Task<ActionResult<EquipmentDto>> CreateEquipment(CreateEquipmentDto dto)
    {
        var result = await _equipmentService.CreateEquipmentAsync(dto);
        return CreatedAtAction(nameof(GetAllEquipment), new { id = result.Data!.Id }, result.Data);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateEquipment(int id, EquipmentDto dto)
    {
        if (id != dto.Id)
            return BadRequest();

        var result = await _equipmentService.UpdateEquipmentAsync(id, dto);
        
        if (!result.Success)
            return NotFound(result.ErrorMessage);

        return NoContent();
    }
}
