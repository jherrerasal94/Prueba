import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ClienteP, ClientePQueryParams, PagedResult } from '../models/cliente-p.model';

@Injectable({
  providedIn: 'root'
})
export class ClientePService {
  private apiUrl = `${environment.apiUrl}/ClientesPs`;

  constructor(private http: HttpClient) { }

  getClientes(queryParams?: ClientePQueryParams): Observable<PagedResult<ClienteP>> {
    let params = new HttpParams();

    if (queryParams) {
      if (queryParams.pageNumber !== undefined) {
        params = params.append('pageNumber', queryParams.pageNumber.toString());
      }
      if (queryParams.pageSize !== undefined) {
        params = params.append('pageSize', queryParams.pageSize.toString());
      }
      if (queryParams.sortField) {
        params = params.append('sortField', queryParams.sortField);
      }
      if (queryParams.sortDirection) {
        params = params.append('sortDirection', queryParams.sortDirection);
      }
      if (queryParams.nombres) {
        params = params.append('nombres', queryParams.nombres);
      }
      if (queryParams.numId) {
        params = params.append('numId', queryParams.numId);
      }
      if (queryParams.estado !== undefined && queryParams.estado !== null) {
        params = params.append('estado', queryParams.estado.toString());
      }
    }

    return this.http.get<PagedResult<ClienteP>>(this.apiUrl, { params });
  }

  getClienteById(id: number): Observable<ClienteP> {
    return this.http.get<ClienteP>(`${this.apiUrl}/${id}`);
  }

  createCliente(cliente: ClienteP): Observable<ClienteP> {
    return this.http.post<ClienteP>(this.apiUrl, cliente);
  }

  updateCliente(id: number, cliente: ClienteP): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, cliente);
  }

  checkIfClienteExists(numId: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/Exists/${numId}`);
  }

  deleteCliente(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/SoftDelete/${id}`, {});
  }

  inactivateCliente(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/SoftDelete/${id}`, {});
  }

  activateCliente(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/Activate/${id}`, {});
  }
}