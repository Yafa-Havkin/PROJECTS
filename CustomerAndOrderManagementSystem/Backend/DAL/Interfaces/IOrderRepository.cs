using Models;

namespace DAL.Interfaces
{
    public interface IOrderRepository
    {
        Task<List<Order>> GetAllOrdersAsync();
        Task<Order> CreateOrderAsync(Order order);
    }
}