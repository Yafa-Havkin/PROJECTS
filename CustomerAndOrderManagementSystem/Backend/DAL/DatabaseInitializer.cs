using DAL.Interfaces;

namespace DAL
{
    public class DatabaseInitializer
    {
        private readonly IDbConnectionFactory _connectionFactory;

        public DatabaseInitializer(IDbConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }

        public void InitializeDatabase()
        {
            using var connection = _connectionFactory.CreateConnection();
            connection.Open();

            var createCustomersTable = @"
                CREATE TABLE IF NOT EXISTS Customers (
                    Id INTEGER PRIMARY KEY AUTOINCREMENT,
                    Name TEXT NOT NULL,
                    Email TEXT NOT NULL,
                    Phone TEXT
                );";

            var createOrdersTable = @"
                CREATE TABLE IF NOT EXISTS Orders (
                    OrderId INTEGER PRIMARY KEY AUTOINCREMENT,
                    CustomerId INTEGER NOT NULL,
                    OrderDate TEXT NOT NULL,
                    TotalAmount REAL NOT NULL,
                    FOREIGN KEY (CustomerId) REFERENCES Customers(Id)
                );";

            using var command = connection.CreateCommand();
            command.CommandText = createCustomersTable;
            command.ExecuteNonQuery();

            command.CommandText = createOrdersTable;
            command.ExecuteNonQuery();
        }
    }
}