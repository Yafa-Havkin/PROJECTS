import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Loan } from '../../models/loan.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private apiUrl = `${environment.apiUrl}/employees`;

  constructor(private http: HttpClient) { }

  getCurrentLoans(employeeId: number): Observable<Loan[]> {
    return this.http.get<Loan[]>(`${this.apiUrl}/${employeeId}/current-loans`);
  }

  getLoanHistory(employeeId: number): Observable<Loan[]> {
    return this.http.get<Loan[]>(`${this.apiUrl}/${employeeId}/loan-history`);
  }
}
