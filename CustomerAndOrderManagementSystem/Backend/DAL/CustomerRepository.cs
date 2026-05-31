using DAL.Interfaces;
using Models;
using Microsoft.Data.Sqlite;
using System.Data.Common;

namespace DAL
{
    public class CustomerRepository : ICustomerRepository
    {
        private readonly IDbConnectionFactory _connectionFactory;

        public CustomerRepository(IDbConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }

        public async Task<List<Customer>> GetAllCustomersAsync()
        {
            var customers = new List<Customer>();
            
            using var connection = (SqliteConnection)_connectionFactory.CreateConnection();
            await connection.OpenAsync();
            
            using var command = connection.CreateCommand();
            command.CommandText = "SELECT Id, Name, Email, Phone FROM Customers";
            
            using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                customers.Add(new Customer
                {
                    Id = reader.GetInt32(0),
                    Name = reader.GetString(1),
                    Email = reader.GetString(2),
                    Phone = reader.IsDBNull(3) ? null : reader.GetString(3)
                });
            }
            
            return customers;
        }

        public async Task<Customer> CreateCustomerAsync(Customer customer)
        {
            using var connection = (SqliteConnection)_connectionFactory.CreateConnection();
            await connection.OpenAsync();
            
            using var command = connection.CreateCommand();
            command.CommandText = "INSERT INTO Customers (Name, Email, Phone) VALUES (@name, @email, @phone); SELECT last_insert_rowid();";
            
            var nameParam = command.CreateParameter();
            nameParam.ParameterName = "@name";
            nameParam.Value = customer.Name;
            command.Parameters.Add(nameParam);
            
            var emailParam = command.CreateParameter();
            emailParam.ParameterName = "@email";
            emailParam.Value = customer.Email;
            command.Parameters.Add(emailParam);
            
            var phoneParam = command.CreateParameter();
            phoneParam.ParameterName = "@phone";
            phoneParam.Value = customer.Phone ?? (object)DBNull.Value;
            command.Parameters.Add(phoneParam);
            
            var newId = Convert.ToInt32(await command.ExecuteScalarAsync());
            customer.Id = newId;
            
            return customer;
        }

        public async Task<bool> UpdateCustomerAsync(int id, Customer customer)
        {
            using var connection = (SqliteConnection)_connectionFactory.CreateConnection();
            await connection.OpenAsync();
            
            using var command = connection.CreateCommand();
            command.CommandText = "UPDATE Customers SET Name = @name, Email = @email, Phone = @phone WHERE Id = @id";
            
            var idParam = command.CreateParameter();
            idParam.ParameterName = "@id";
            idParam.Value = id;
            command.Parameters.Add(idParam);
            
            var nameParam = command.CreateParameter();
            nameParam.ParameterName = "@name";
            nameParam.Value = customer.Name;
            command.Parameters.Add(nameParam);
            
            var emailParam = command.CreateParameter();
            emailParam.ParameterName = "@email";
            emailParam.Value = customer.Email;
            command.Parameters.Add(emailParam);
            
            var phoneParam = command.CreateParameter();
            phoneParam.ParameterName = "@phone";
            phoneParam.Value = customer.Phone ?? (object)DBNull.Value;
            command.Parameters.Add(phoneParam);
            
            var rowsAffected = await command.ExecuteNonQueryAsync();
            return rowsAffected > 0;
        }

        public async Task<bool> DeleteCustomerAsync(int id)
        {
            using var connection = (SqliteConnection)_connectionFactory.CreateConnection();
            await connection.OpenAsync();
            
            // Cascade Delete - קודם מוחקים את ההזמנות
            using var deleteOrdersCmd = connection.CreateCommand();
            deleteOrdersCmd.CommandText = "DELETE FROM Orders WHERE CustomerId = @customerId";
            
            var customerIdParam = deleteOrdersCmd.CreateParameter();
            customerIdParam.ParameterName = "@customerId";
            customerIdParam.Value = id;
            deleteOrdersCmd.Parameters.Add(customerIdParam);
            
            await deleteOrdersCmd.ExecuteNonQueryAsync();
            
            // אחר כך מוחקים את הלקוח
            using var command = connection.CreateCommand();
            command.CommandText = "DELETE FROM Customers WHERE Id = @id";
            
            var idParam = command.CreateParameter();
            idParam.ParameterName = "@id";
            idParam.Value = id;
            command.Parameters.Add(idParam);
            
            var rowsAffected = await command.ExecuteNonQueryAsync();
            return rowsAffected > 0;
        }
    }
}