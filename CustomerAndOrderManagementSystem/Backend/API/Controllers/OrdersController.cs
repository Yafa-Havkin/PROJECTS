using Microsoft.AspNetCore.Mvc;
using DAL.Interfaces;
using Models;
using FluentValidation;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrdersController : ControllerBase
    {
        private readonly IOrderRepository _orderRepository;
        private readonly IValidator<Order> _validator;

        public OrdersController(IOrderRepository orderRepository, IValidator<Order> validator)
        {
            _orderRepository = orderRepository;
            _validator = validator;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllOrders()
        {
            var orders = await _orderRepository.GetAllOrdersAsync();
            return Ok(orders);
        }

        [HttpPost]
        public async Task<IActionResult> CreateOrder([FromBody] Order order)
        {
            var validationResult = await _validator.ValidateAsync(order);
            if (!validationResult.IsValid)
            {
                throw new ArgumentException($"Validation failed: {string.Join(", ", validationResult.Errors.Select(e => e.ErrorMessage))}");
            }

            var createdOrder = await _orderRepository.CreateOrderAsync(order);
            return CreatedAtAction(nameof(GetAllOrders), new { id = createdOrder.OrderId }, createdOrder);
        }
    }
}