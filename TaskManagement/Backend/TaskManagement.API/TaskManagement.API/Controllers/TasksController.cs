using Microsoft.AspNetCore.Mvc;
using TaskManagement.DAL;
using TaskManagement.Models;
using Microsoft.EntityFrameworkCore;
using System.Text;
using System.Security.Cryptography.X509Certificates;

[ApiController]
[Route("api/[controller]")]
public class TasksController : ControllerBase
{
   private readonly TaskManagementDbContext _context;

   public TasksController(TaskManagementDbContext context)
    {
       _context = context; 
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TaskItem>>> GetTasks()
    {
        return await _context.Tasks.ToListAsync();
    }

    [HttpPost]
    public async Task<ActionResult<TaskItem> >createNewTask(TaskItem task)
    {
        try
        {
           if(task==null)
           {
            return BadRequest("Task is null");
           }
          task.CreatedAt = DateTime.Now;
          _context.Tasks.Add(task);
          await _context.SaveChangesAsync(); 
          return CreatedAtAction(nameof(GetTasks), new {id = task.Id }, task);
        }
        catch(Exception ex)
        {
            return StatusCode(500, "Internal server error");
        }

        
    }

    [HttpPut("{id}")]

        public async Task<ActionResult<TaskItem> > updateTaskStatus(int id, TaskItem task)
        {
            try
            {
               if(id != task.Id)
               {
                return BadRequest("ID mismatch");
               }
               var existingTask = await _context.Tasks.FindAsync(id);
               if(existingTask == null)
               {
                return NotFound();
               }
                existingTask.IsCompleted = task.IsCompleted;
                await _context.SaveChangesAsync();
                return existingTask;
                
            }
            catch(Exception ex)
            {
                return StatusCode(500,"Internal server error");
            }
        }
}