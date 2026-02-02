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
  errorMessage: string = '';
  isLoading: boolean = false;
  constructor(private taskService: Task) {}

  loadTasks(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.taskService.getTasks().subscribe({
      next: (tasks) => {
        this.tasks = tasks;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Error loading tasks. Please try again.';
        this.isLoading = false;
        console.error('Error loading tasks:', error);
      }
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
      this.taskService.createTask(newTask).subscribe({
        next: () => {
          this.loadTasks();
          this.newTaskTitle = '';
          this.errorMessage = '';
        },
        error: (error) => {
          this.errorMessage = 'Error adding task. Please try again.';
          console.error('Error adding task:', error);
        }
      });
    }
  }

  toggleTask(task :TaskItem): void{
    this.taskService.updateTaskStatus(task.id,task).subscribe({
      next: () => {
        this.loadTasks();
        this.errorMessage = '';
      },
      error: (error) => {
        this.errorMessage = 'Error updating task. Please try again.';
        console.error('Error updating task:', error);
      }
    });
  }
}
