using System.ComponentModel.DataAnnotations;

namespace EquipmentManagement.Core.DTOs;

public class EquipmentDto
{
    public int Id { get; set; }

    [Required(ErrorMessage = "Equipment name is required")]
    [StringLength(200, ErrorMessage = "Equipment name cannot exceed 200 characters")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "IsAvailableForLoan is required")]
    public bool IsAvailableForLoan { get; set; }

    [Required(ErrorMessage = "Status is required")]
    [StringLength(50, ErrorMessage = "Status cannot exceed 50 characters")]
    public string Status { get; set; } = string.Empty;
}
