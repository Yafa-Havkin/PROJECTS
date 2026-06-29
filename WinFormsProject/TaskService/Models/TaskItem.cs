using System;
using System.Collections.Generic;
using System.Text;

namespace TaskService.Models
{
    public class TaskItem
    {
        public int Id { get; set; }
        public string Title { get; set; } = "Untiteled Task";
        public string Discription { get; set; } = string.Empty;
        public bool IsDone { get; set; } = false;

        public TaskItem(int id, string title, string description)
        {
            Id = id;
            Title = title;
            Discription = description;
        }
    }
}
