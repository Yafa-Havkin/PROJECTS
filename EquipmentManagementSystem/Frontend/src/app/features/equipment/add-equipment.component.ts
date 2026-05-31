import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EquipmentService } from '../../core/services/equipment.service';
import { CreateEquipment } from '../../models/create-equipment.model';

@Component({
  selector: 'app-add-equipment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-equipment.component.html',
  styleUrl: './add-equipment.component.css'
})
export class AddEquipmentComponent {
  equipment: CreateEquipment = {
    name: '',
    isAvailableForLoan: true,
    status: 'Available'
  };

  constructor(
    private equipmentService: EquipmentService,
    private router: Router
  ) {}

  onSubmit(): void {
    this.equipmentService.createEquipment(this.equipment).subscribe({
      next: () => {
        alert('Equipment added successfully');
        this.router.navigate(['/equipment']);
      },
      error: (error) => {
        console.error('Error adding equipment:', error);
        alert('Failed to add equipment');
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/equipment']);
  }
}
