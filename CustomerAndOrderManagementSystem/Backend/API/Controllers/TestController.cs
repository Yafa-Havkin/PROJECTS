using Microsoft.AspNetCore.Mvc;
using DAL.Interfaces;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TestController : ControllerBase
    {
        private readonly IDbConnectionFactory _dbConnectionFactory;

        public TestController(IDbConnectionFactory dbConnectionFactory)
        {
            _dbConnectionFactory = dbConnectionFactory;
        }

        [HttpGet("connection")]
        public IActionResult TestConnection()
        {
            try
            {
                using var connection = _dbConnectionFactory.CreateConnection();
                connection.Open();
                return Ok(new { message = "Database connection successful!", timestamp = DateTime.Now });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Database connection failed", error = ex.Message });
            }
        }

        [HttpGet("ping")]
        public IActionResult Ping()
        {
            return Ok(new { message = "API is running!", timestamp = DateTime.Now });
        }
    }
}