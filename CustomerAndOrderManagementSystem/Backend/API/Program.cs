using DAL;
using DAL.Interfaces;
using BLL.Interfaces;
using BLL.Services;
using API.Middleware;
using FluentValidation;
using API.Validators;
using Models;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add FluentValidation
builder.Services.AddScoped<IValidator<Customer>, CustomerValidator>();
builder.Services.AddScoped<IValidator<Order>, OrderValidator>();

// Register BLL Services
builder.Services.AddScoped<ICustomerService, CustomerService>();

// Register database connection factory
builder.Services.AddScoped<IDbConnectionFactory, DbConnectionFactory>();
builder.Services.AddScoped<DatabaseInitializer>();
builder.Services.AddScoped<ICustomerRepository, CustomerRepository>();
builder.Services.AddScoped<IOrderRepository, OrderRepository>();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Initialize database
using (var scope = app.Services.CreateScope())
{
    var dbInitializer = scope.ServiceProvider.GetRequiredService<DatabaseInitializer>();
    dbInitializer.InitializeDatabase();
}

// Configure the HTTP request pipeline
app.UseMiddleware<GlobalExceptionMiddleware>();
app.UseMiddleware<RequestLoggingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");
app.UseAuthorization();
app.MapControllers();

app.Run();