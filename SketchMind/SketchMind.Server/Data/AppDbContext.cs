using Microsoft.EntityFrameworkCore;
using SketchMind.Server.Models;

namespace SketchMind.Server.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<Drawing> Drawings { get; set; }
    }
}