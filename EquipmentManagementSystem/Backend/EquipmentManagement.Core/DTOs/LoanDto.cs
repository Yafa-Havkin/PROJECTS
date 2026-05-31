namespace EquipmentManagement.Core.DTOs;

public class LoanDto
{
    public int Id { get; set; }
    public int EquipmentId { get; set; }
    public string EquipmentName { get; set; } = string.Empty;
    public int EmployeeId { get; set; }
    public string EmployeeName { get; set; } = string.Empty;
    public int ManagerId { get; set; }
    public string ManagerName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}
