import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Equipment } from '../../models/equipment.model';
import { CreateEquipment } from '../../models/create-equipment.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EquipmentService {
  private apiUrl = `${environment.apiUrl}/equipment`;

  constructor(private http: HttpClient) { }

  getAllEquipment(): Observable<Equipment[]> {
    return this.http.get<Equipment[]>(this.apiUrl);
  }

  getAvailableEquipment(): Observable<Equipment[]> {
    return this.http.get<Equipment[]>(`${this.apiUrl}/available`);
  }

  createEquipment(equipment: CreateEquipment): Observable<Equipment> {
    return this.http.post<Equipment>(this.apiUrl, equipment);
  }

  updateEquipment(id: number, equipment: Equipment): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, equipment);
  }
}
