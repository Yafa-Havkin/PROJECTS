using System;
using System.Collections.Generic;
using System.Text;
using System.ServiceModel;
using TaskService.Models;

namespace TaskService.Interfaces
{
    [ServiceContract]
    public interface IService1
    {
        [OperationContract]
        string GetMessage(string name);
        TaskItem CreateTask(string title, string discription);
        TaskItem GetTask(int id);
        List<TaskItem> GetAllTasks();
        bool UpdateTask(int id);

    }
}
