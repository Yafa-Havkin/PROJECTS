using EquipmentManagement.Core.DTOs;

namespace EquipmentManagement.Core.Interfaces;

public interface IEquipmentService
{
    Task<List<EquipmentDto>> GetAllEquipmentAsync();
    Task<List<EquipmentDto>> GetAvailableEquipmentAsync();
    Task<ServiceResult<EquipmentDto>> CreateEquipmentAsync(CreateEquipmentDto dto);
    Task<ServiceResult<bool>> UpdateEquipmentAsync(int id, EquipmentDto dto);
}
