namespace EquipmentManagement.Core.Entities;

public class Loan
{
    public int Id { get; set; }
    public int EquipmentId { get; set; }
    public int ManagerId { get; set; }
    public int EmployeeId { get; set; }
    public string Status { get; set; } = string.Empty;

    public Equipment? Equipment { get; set; }
    public Employee? Manager { get; set; }
    public Employee? Employee { get; set; }
}
