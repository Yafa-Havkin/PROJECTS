import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Loan } from '../../models/loan.model';
import { CreateLoan } from '../../models/create-loan.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LoanService {
  private apiUrl = `${environment.apiUrl}/loans`;

  constructor(private http: HttpClient) { }

  getActiveLoans(): Observable<Loan[]> {
    return this.http.get<Loan[]>(`${this.apiUrl}/active`);
  }

  createLoan(loan: CreateLoan): Observable<Loan> {
    return this.http.post<Loan>(this.apiUrl, loan);
  }

  returnLoan(loanId: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${loanId}/return`, {});
  }
}
