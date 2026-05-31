using EquipmentManagement.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace EquipmentManagement.Infrastructure.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<Employee> Employees { get; set; }
    public DbSet<Equipment> Equipment { get; set; }
    public DbSet<Loan> Loans { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Employee>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Role).IsRequired().HasMaxLength(50);
        });

        modelBuilder.Entity<Equipment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(50);
        });

        modelBuilder.Entity<Loan>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(50);

            entity.HasOne(l => l.Equipment)
                .WithMany()
                .HasForeignKey(l => l.EquipmentId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(l => l.Manager)
                .WithMany()
                .HasForeignKey(l => l.ManagerId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(l => l.Employee)
                .WithMany()
                .HasForeignKey(l => l.EmployeeId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
