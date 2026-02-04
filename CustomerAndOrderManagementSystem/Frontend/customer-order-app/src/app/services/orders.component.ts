import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Order } from '../../models/order.model';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css']
})
export class OrdersComponent implements OnInit {
  orders: Order[] = [];
  orderForm: FormGroup;
  isModalOpen: boolean = false;

  constructor(private orderService: OrderService, private fb: FormBuilder) {
    // הגדרת הטופס והשדות שלו
    this.orderForm = this.fb.group({
      customerId: ['', Validators.required], // שדה חובה
      orderDate: ['', Validators.required],  // שדה חובה
      totalAmount: ['', [Validators.required, Validators.min(0)]] // חובה וגדול מ-0
    });
  }

  // פונקציה שרצה אוטומטית כשהרכיב עולה לאוויר
  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders() {
    this.orderService.getOrders().subscribe({
      next: (data) => this.orders = data,
      error: (err) => console.error('Error loading orders', err)
    });
  }

  openModal() {
    this.isModalOpen = true;
    this.orderForm.reset(); // מנקה את הטופס לפני פתיחה
  }

  closeModal() {
    this.isModalOpen = false;
  }

  onSubmit() {
    if (this.orderForm.valid) {
      const newOrder: Order = this.orderForm.value;
      this.orderService.addOrder(newOrder).subscribe(() => {
        this.loadOrders(); // טוען מחדש את הטבלה כדי לראות את ההזמנה החדשה
        this.closeModal();
      });
    }
  }
}