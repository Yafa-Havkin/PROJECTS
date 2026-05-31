import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmployeeService } from '../../core/services/employee.service';
import { Loan } from '../../models/loan.model';

@Component({
  selector: 'app-current-loans',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './current-loans.component.html',
  styleUrl: './current-loans.component.css'
})
export class CurrentLoansComponent implements OnInit {
  loans: Loan[] = [];
  employeeId: number = 1; // TODO: Get from route or auth

  constructor(private employeeService: EmployeeService) {}

  ngOnInit(): void {
    this.loadCurrentLoans();
  }

  loadCurrentLoans(): void {
    this.employeeService.getCurrentLoans(this.employeeId).subscribe({
      next: (data) => {
        this.loans = data;
      },
      error: (error) => {
        console.error('Error loading current loans:', error);
      }
    });
  }
}
