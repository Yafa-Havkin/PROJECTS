using System;
using System.Collections.Generic;
using System.Text;
using TaskService.Interfaces;
using TaskService.Models;

namespace TaskService.Services
{
    public class Service1 : IService1
    {
        static int ID = 1001;
        static List<TaskItem> tasks = new List<TaskItem>();
        public TaskItem CreateTask(string title, string discription)
        {
            var task = new TaskItem(ID++, title, discription);
            tasks.Add(task);
            return task;
        }

        public TaskItem GetTask(int id)
        {
            return tasks.Find(t => t.Id == id);
        }

        public List<TaskItem> GetAllTasks()
        {
            return tasks;
        }

        public bool UpdateTask(int id)
        {
            var task = tasks.Find(t => t.Id == id);
            if (task != null)
            {
                task.IsDone = true;
                return true;
            }
            return false;
        }

        public string GetMessage(string name)
        {
            return $"שלום {name}, הארכיטקטורה עובדת!";
        }
    }
}
