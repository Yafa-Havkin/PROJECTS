namespace EquipmentManagement.Core.Entities;

public class Equipment
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsAvailableForLoan { get; set; }
    public string Status { get; set; } = string.Empty;
}
