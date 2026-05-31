import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LoanService } from '../../core/services/loan.service';
import { Loan } from '../../models/loan.model';

@Component({
  selector: 'app-active-loans',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './active-loans.component.html',
  styleUrl: './active-loans.component.css'
})
export class ActiveLoansComponent implements OnInit {
  loans: Loan[] = [];

  constructor(private loanService: LoanService) {}

  ngOnInit(): void {
    this.loadActiveLoans();
  }

  loadActiveLoans(): void {
    this.loanService.getActiveLoans().subscribe({
      next: (data) => {
        this.loans = data;
      },
      error: (error) => {
        console.error('Error loading active loans:', error);
      }
    });
  }

  returnLoan(loanId: number): void {
    if (confirm('Are you sure you want to mark this loan as returned?')) {
      this.loanService.returnLoan(loanId).subscribe({
        next: () => {
          alert('Loan returned successfully');
          this.loadActiveLoans();
        },
        error: (error) => {
          console.error('Error returning loan:', error);
          alert('Failed to return loan');
        }
      });
    }
  }
}
