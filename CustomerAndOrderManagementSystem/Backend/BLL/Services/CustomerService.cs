using BLL.Interfaces;
using DAL.Interfaces;
using Models;

namespace BLL.Services
{
    public class CustomerService : ICustomerService
    {
        private readonly ICustomerRepository _customerRepository;
        private readonly IOrderRepository _orderRepository;

        public CustomerService(ICustomerRepository customerRepository, IOrderRepository orderRepository)
        {
            _customerRepository = customerRepository;
            _orderRepository = orderRepository;
        }

        public async Task<List<Customer>> GetAllCustomersAsync()
        {
            return await _customerRepository.GetAllCustomersAsync();
        }

        public async Task<Customer> CreateCustomerAsync(Customer customer)
        {
            // כאן אפשר להוסיף לוגיקה עסקית
            // לדוגמה: בדיקה אם המייל כבר קיים
            return await _customerRepository.CreateCustomerAsync(customer);
        }

        public async Task<bool> UpdateCustomerAsync(int id, Customer customer)
        {
            return await _customerRepository.UpdateCustomerAsync(id, customer);
        }

        public async Task<bool> DeleteCustomerAsync(int id)
        {
            // Cascade Delete - מוחקים קודם את ההזמנות
            var orders = await _orderRepository.GetAllOrdersAsync();
            var customerOrders = orders.Where(o => o.CustomerId == id).ToList();
            
            foreach (var order in customerOrders)
            {
                // כאן צריך להוסיף DeleteOrder ב-IOrderRepository
                // await _orderRepository.DeleteOrderAsync(order.OrderId.Value);
            }
            
            return await _customerRepository.DeleteCustomerAsync(id);
        }
    }
}
