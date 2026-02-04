using DAL.Interfaces;
using Models;
using Microsoft.Data.Sqlite;
using System.Data.Common;

namespace DAL
{
    public class OrderRepository : IOrderRepository
    {
        private readonly IDbConnectionFactory _connectionFactory;

        public OrderRepository(IDbConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }

        public async Task<List<Order>> GetAllOrdersAsync()
        {
            var orders = new List<Order>();
            
            using var connection = (SqliteConnection)_connectionFactory.CreateConnection();
            await connection.OpenAsync();
            
            using var command = connection.CreateCommand();
            command.CommandText = "SELECT OrderId, CustomerId, OrderDate, TotalAmount FROM Orders";
            
            using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                orders.Add(new Order
                {
                    OrderId = reader.GetInt32(0),
                    CustomerId = reader.GetInt32(1),
                    OrderDate = DateTime.Parse(reader.GetString(2)),
                    TotalAmount = reader.GetDecimal(3)
                });
            }
            
            return orders;
        }

        public async Task<Order> CreateOrderAsync(Order order)
        {
            using var connection = (SqliteConnection)_connectionFactory.CreateConnection();
            await connection.OpenAsync();
            
            using var command = connection.CreateCommand();
            command.CommandText = "INSERT INTO Orders (CustomerId, OrderDate, TotalAmount) VALUES (@customerId, @orderDate, @totalAmount); SELECT last_insert_rowid();";
            
            var customerIdParam = command.CreateParameter();
            customerIdParam.ParameterName = "@customerId";
            customerIdParam.Value = order.CustomerId;
            command.Parameters.Add(customerIdParam);
            
            var orderDateParam = command.CreateParameter();
            orderDateParam.ParameterName = "@orderDate";
            orderDateParam.Value = order.OrderDate.ToString("yyyy-MM-dd HH:mm:ss");
            command.Parameters.Add(orderDateParam);
            
            var totalAmountParam = command.CreateParameter();
            totalAmountParam.ParameterName = "@totalAmount";
            totalAmountParam.Value = order.TotalAmount;
            command.Parameters.Add(totalAmountParam);
            
            var newId = Convert.ToInt32(await command.ExecuteScalarAsync());
            order.OrderId = newId;
            
            return order;
        }
    }
}