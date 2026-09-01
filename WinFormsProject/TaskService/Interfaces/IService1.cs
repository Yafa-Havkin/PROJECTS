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
        [OperationContract]
        TaskItem CreateTask(string title, string discription);
        [OperationContract]
        TaskItem GetTask(int id);
        [OperationContract]
        List<TaskItem> GetAllTasks();
        [OperationContract]
        bool UpdateTask(int id);

    }
}
