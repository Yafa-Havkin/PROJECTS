import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LoanService } from '../../core/services/loan.service';
import { EquipmentService } from '../../core/services/equipment.service';
import { CreateLoan } from '../../models/create-loan.model';
import { Equipment } from '../../models/equipment.model';

@Component({
  selector: 'app-create-loan',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-loan.component.html',
  styleUrl: './create-loan.component.css'
})
export class CreateLoanComponent implements OnInit {
  loan: CreateLoan = {
    equipmentId: 0,
    employeeId: 0,
    managerId: 0
  };

  availableEquipment: Equipment[] = [];

  constructor(
    private loanService: LoanService,
    private equipmentService: EquipmentService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAvailableEquipment();
  }

  loadAvailableEquipment(): void {
    this.equipmentService.getAvailableEquipment().subscribe({
      next: (data) => {
        this.availableEquipment = data;
      },
      error: (error) => {
        console.error('Error loading available equipment:', error);
      }
    });
  }

  onSubmit(): void {
    this.loanService.createLoan(this.loan).subscribe({
      next: () => {
        alert('Loan created successfully');
        this.router.navigate(['/loans/active']);
      },
      error: (error) => {
        console.error('Error creating loan:', error);
        alert('Failed to create loan');
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/loans/active']);
  }
}
