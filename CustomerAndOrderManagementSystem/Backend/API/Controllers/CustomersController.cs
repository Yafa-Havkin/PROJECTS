using Microsoft.AspNetCore.Mvc;
using DAL.Interfaces;
using Models;
using FluentValidation;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CustomersController : ControllerBase
    {
        private readonly ICustomerRepository _customerRepository;
        private readonly IValidator<Customer> _validator;

        public CustomersController(ICustomerRepository customerRepository, IValidator<Customer> validator)
        {
            _customerRepository = customerRepository;
            _validator = validator;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllCustomers()
        {
            var customers = await _customerRepository.GetAllCustomersAsync();
            return Ok(customers);
        }

        [HttpPost]
        public async Task<IActionResult> CreateCustomer([FromBody] Customer customer)
        {
            var validationResult = await _validator.ValidateAsync(customer);
            if (!validationResult.IsValid)
            {
                throw new ArgumentException($"Validation failed: {string.Join(", ", validationResult.Errors.Select(e => e.ErrorMessage))}");
            }

            var createdCustomer = await _customerRepository.CreateCustomerAsync(customer);
            return CreatedAtAction(nameof(GetAllCustomers), new { id = createdCustomer.Id }, createdCustomer);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCustomer(int id, [FromBody] Customer customer)
        {
            var updated = await _customerRepository.UpdateCustomerAsync(id, customer);
            if (!updated)
            {
                throw new KeyNotFoundException($"Customer with ID {id} not found");
            }
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCustomer(int id)
        {
            var deleted = await _customerRepository.DeleteCustomerAsync(id);
            if (!deleted)
            {
                throw new KeyNotFoundException($"Customer with ID {id} not found");
            }
            return NoContent();
        }
    }
}