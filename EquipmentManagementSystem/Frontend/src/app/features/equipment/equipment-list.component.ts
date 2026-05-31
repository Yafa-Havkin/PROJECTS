import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EquipmentService } from '../../core/services/equipment.service';
import { Equipment } from '../../models/equipment.model';

@Component({
  selector: 'app-equipment-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './equipment-list.component.html',
  styleUrl: './equipment-list.component.css'
})
export class EquipmentListComponent implements OnInit {
  equipment: Equipment[] = [];

  constructor(private equipmentService: EquipmentService) {}

  ngOnInit(): void {
    this.loadEquipment();
  }

  loadEquipment(): void {
    this.equipmentService.getAllEquipment().subscribe({
      next: (data) => {
        this.equipment = data;
      },
      error: (error) => {
        console.error('Error loading equipment:', error);
      }
    });
  }
}
