namespace Models.Entities
{
    public class Order
    {
        public int OrderId { get; set; }
        public int CustomerId { get; set; }
        public DateTime OrderDate { get; set; }
        public decimal TotalAmount { get; set; }
        public string Status { get; set; } = "Pending";
        public int CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; }
        
        // Navigation properties
        public Customer? Customer { get; set; }
        public List<OrderItem> OrderItems { get; set; } = new();
    }
}