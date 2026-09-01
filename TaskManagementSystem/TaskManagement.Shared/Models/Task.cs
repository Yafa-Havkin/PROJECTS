using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TaskManagement.Shared.Enums;

namespace TaskManagement.Shared.Models
{
    public class Task
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public Boolean IsCompleted { get; set; }
        public Status Status { get; set; }
    }
}
