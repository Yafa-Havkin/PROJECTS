import { Routes } from '@angular/router';
import { CurrentLoansComponent } from './features/employees/current-loans.component';
import { LoanHistoryComponent } from './features/employees/loan-history.component';
import { EquipmentListComponent } from './features/equipment/equipment-list.component';
import { AddEquipmentComponent } from './features/equipment/add-equipment.component';
import { CreateLoanComponent } from './features/loans/create-loan.component';
import { ActiveLoansComponent } from './features/loans/active-loans.component';

export const routes: Routes = [
  { path: '', redirectTo: '/employee/current-loans', pathMatch: 'full' },
  
  // Employee routes
  { path: 'employee/current-loans', component: CurrentLoansComponent },
  { path: 'employee/loan-history', component: LoanHistoryComponent },
  
  // Manager - Equipment routes
  { path: 'equipment', component: EquipmentListComponent },
  { path: 'equipment/add', component: AddEquipmentComponent },
  
  // Manager - Loan routes
  { path: 'loans/active', component: ActiveLoansComponent },
  { path: 'loans/create', component: CreateLoanComponent },
  
  // Fallback
  { path: '**', redirectTo: '/employee/current-loans' }
];
