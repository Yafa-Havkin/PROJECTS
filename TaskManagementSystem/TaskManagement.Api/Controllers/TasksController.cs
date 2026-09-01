using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;

namespace TaskManagement.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TasksController : Controller
    {
        [HttpGet]
        public ActionResult<IEnumerable<Task>> getAllTasks()
        {
            return null;
        }
    }
}
