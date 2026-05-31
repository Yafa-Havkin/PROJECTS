using System.ComponentModel.DataAnnotations;

namespace EquipmentManagement.Core.DTOs;

public class CreateLoanDto
{
    [Required(ErrorMessage = "Equipment ID is required")]
    [Range(1, int.MaxValue, ErrorMessage = "Equipment ID must be greater than 0")]
    public int EquipmentId { get; set; }

    [Required(ErrorMessage = "Employee ID is required")]
    [Range(1, int.MaxValue, ErrorMessage = "Employee ID must be greater than 0")]
    public int EmployeeId { get; set; }

    [Required(ErrorMessage = "Manager ID is required")]
    [Range(1, int.MaxValue, ErrorMessage = "Manager ID must be greater than 0")]
    public int ManagerId { get; set; }
}
