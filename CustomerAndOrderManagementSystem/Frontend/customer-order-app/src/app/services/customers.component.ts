import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Customer } from '../../models/customer.model';
import { CustomerService } from '../../services/customer.service';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.css']
})
export class CustomersComponent implements OnInit {
  customers: Customer[] = [];
  customerForm: FormGroup;
  isModalOpen: boolean = false;
  isEditMode: boolean = false;
  currentCustomerId: number | null = null;

  constructor(
    private customerService: CustomerService,
    private fb: FormBuilder
  ) {
    this.customerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['']
    });
  }

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers() {
    this.customerService.getCustomers().subscribe({
      next: (data) => this.customers = data,
      error: (err) => console.error('Error loading customers', err)
    });
  }

  openModal(customer?: Customer) {
    this.isModalOpen = true;
    if (customer) {
      this.isEditMode = true;
      this.currentCustomerId = customer.id!;
      this.customerForm.patchValue(customer);
    } else {
      this.isEditMode = false;
      this.currentCustomerId = null;
      this.customerForm.reset();
    }
  }

  closeModal() {
    this.isModalOpen = false;
  }

  onSubmit() {
    if (this.customerForm.valid) {
      const customerData: Customer = this.customerForm.value;
      
      if (this.isEditMode && this.currentCustomerId) {
        // לוגיקה לעדכון (יש להוסיף ב-Service)
        console.log('Updating customer', customerData);
      } else {
        this.customerService.addCustomer(customerData).subscribe(() => {
          this.loadCustomers();
          this.closeModal();
        });
      }
    }
  }
}