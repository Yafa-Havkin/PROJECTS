using EquipmentManagement.Core.DTOs;
using EquipmentManagement.Core.Entities;
using EquipmentManagement.Core.Interfaces;
using EquipmentManagement.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EquipmentManagement.Services.Services;

public class EquipmentService : IEquipmentService
{
    private readonly ApplicationDbContext _context;

    public EquipmentService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<EquipmentDto>> GetAllEquipmentAsync()
    {
        return await _context.Equipment
            .Select(e => new EquipmentDto
            {
                Id = e.Id,
                Name = e.Name,
                IsAvailableForLoan = e.IsAvailableForLoan,
                Status = e.Status
            })
            .ToListAsync();
    }

    public async Task<List<EquipmentDto>> GetAvailableEquipmentAsync()
    {
        return await _context.Equipment
            .Where(e => e.IsAvailableForLoan && e.Status == "Available")
            .Select(e => new EquipmentDto
            {
                Id = e.Id,
                Name = e.Name,
                IsAvailableForLoan = e.IsAvailableForLoan,
                Status = e.Status
            })
            .ToListAsync();
    }

    public async Task<ServiceResult<EquipmentDto>> CreateEquipmentAsync(CreateEquipmentDto dto)
    {
        var equipment = new Equipment
        {
            Name = dto.Name,
            IsAvailableForLoan = dto.IsAvailableForLoan,
            Status = dto.Status
        };

        _context.Equipment.Add(equipment);
        await _context.SaveChangesAsync();

        var equipmentDto = new EquipmentDto
        {
            Id = equipment.Id,
            Name = equipment.Name,
            IsAvailableForLoan = equipment.IsAvailableForLoan,
            Status = equipment.Status
        };

        return ServiceResult<EquipmentDto>.SuccessResult(equipmentDto);
    }

    public async Task<ServiceResult<bool>> UpdateEquipmentAsync(int id, EquipmentDto dto)
    {
        var equipment = await _context.Equipment.FindAsync(id);
        if (equipment == null)
            return ServiceResult<bool>.FailureResult("Equipment not found");

        equipment.Name = dto.Name;
        equipment.IsAvailableForLoan = dto.IsAvailableForLoan;
        equipment.Status = dto.Status;

        await _context.SaveChangesAsync();

        return ServiceResult<bool>.SuccessResult(true);
    }
}
