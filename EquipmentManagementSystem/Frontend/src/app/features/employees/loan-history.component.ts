import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmployeeService } from '../../core/services/employee.service';
import { Loan } from '../../models/loan.model';

@Component({
  selector: 'app-loan-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loan-history.component.html',
  styleUrl: './loan-history.component.css'
})
export class LoanHistoryComponent implements OnInit {
  loans: Loan[] = [];
  employeeId: number = 1; // TODO: Get from route or auth

  constructor(private employeeService: EmployeeService) {}

  ngOnInit(): void {
    this.loadLoanHistory();
  }

  loadLoanHistory(): void {
    this.employeeService.getLoanHistory(this.employeeId).subscribe({
      next: (data) => {
        this.loans = data;
      },
      error: (error) => {
        console.error('Error loading loan history:', error);
      }
    });
  }
}
