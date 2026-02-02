import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TaskItem } from '../models/task-item.interface';
@Injectable({
  providedIn: 'root',
})
export class Task {
  private apiUrl = 'http://localhost:5206/api/tasks';

  constructor(private http:HttpClient){}
  
  getTasks():Observable<TaskItem[]>{
    return this.http.get<TaskItem[]>(this.apiUrl);
  }

  createTask(task : TaskItem): Observable<TaskItem>{
    return this.http.post<TaskItem>(this.apiUrl, task);
  }

  updateTaskStatus(id: number,task :TaskItem): Observable<TaskItem>{
    return this.http.put<TaskItem>(`${this.apiUrl}/${id}`,task);
  }
}
