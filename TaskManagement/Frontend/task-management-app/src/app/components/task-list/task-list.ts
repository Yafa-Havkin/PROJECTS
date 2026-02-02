import { Component } from '@angular/core';
import {Task } from '../../services/task';
import { TaskItem } from '../../models/task-item.interface';
import { OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-task-list',
  imports: [FormsModule, CommonModule],
  templateUrl: './task-list.html',
  styleUrl: './task-list.css',
})
export class TaskList implements OnInit{
  newTaskTitle: string = '';
  tasks: TaskItem[] = [];
  constructor(private taskService: Task) {}

  loadTasks(): void {
    this.taskService.getTasks().subscribe(tasks => {
      this.tasks = tasks;
    });
  }

  ngOnInit(): void {
    this.loadTasks();
  }

  addTask(): void {
    if(this.newTaskTitle.trim()){
      const newTask:TaskItem = {
        id: 0,
        title: this.newTaskTitle,
        isCompleted: false,
        createdAt: new Date()
      };
      this.taskService.createTask(newTask).subscribe(() => {
        this.loadTasks();
        this.newTaskTitle = '';
      });
    }
  }

  toggleTask(task :TaskItem): void{
    this.taskService.updateTaskStatus(task.id,task).subscribe(()=> {
      this.loadTasks();
    });
  }
}
