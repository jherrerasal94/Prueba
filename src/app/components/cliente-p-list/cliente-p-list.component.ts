import { Component, OnInit } from '@angular/core';
import { ClientePService } from '../../services/cliente-p.service';
import { ClienteP, PagedResult, ClientePQueryParams } from '../../models/cliente-p.model';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';


@Component({
  selector: 'app-cliente-p-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './cliente-p-list.component.html',
  styleUrl: './cliente-p-list.component.css'
})
export class ClientePListComponent implements OnInit {
  clientes: ClienteP[] = [];

  pagedResult: PagedResult<ClienteP> | undefined;
  filterForm: FormGroup;

  currentPage: number = 1;
  pageSize: number = 5;
  pageSizeOptions: number[] = [5, 10, 20, 50];

  sortField: string = 'Id';
  sortDirection: 'asc' | 'desc' = 'asc';

  public Math = Math;

  constructor(
    private clientePService: ClientePService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      nombres: [''],
      numId: [''],
      estado: [true]
    });
  }

  ngOnInit(): void {
    this.loadClientes();
    this.filterForm.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
    ).subscribe(() => {
      this.currentPage = 1;
      this.loadClientes();
    });
  }

  loadClientes(): void {
    const currentFilters = this.filterForm.value;

    const queryParams: ClientePQueryParams = {
      pageNumber: this.currentPage,
      pageSize: this.pageSize,
      sortField: this.sortField,
      sortDirection: this.sortDirection,
      nombres: currentFilters.nombres || undefined,
      numId: currentFilters.numId || undefined,
      estado: currentFilters.estado
    };

    this.clientes = [];
    this.pagedResult = undefined;

    this.clientePService.getClientes(queryParams).subscribe({
      next: (data) => {
        this.pagedResult = data;
        this.clientes = data.items;
      },
      error: (err) => {
        console.error('Error al cargar clientes:', err);
        alert('Hubo un error al cargar los clientes. Revisa la consola.');
        this.clientes = [];
        this.pagedResult = undefined;
      }
    });
  }

  goToPage(page: number): void {
    if (this.pagedResult && page >= 1 && page <= this.pagedResult.totalPages) {
      this.currentPage = page;
      this.loadClientes();
    }
  }

  onPageSizeChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.pageSize = parseInt(selectElement.value, 10);
    this.currentPage = 1;
    this.loadClientes();
  }

  sortBy(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.loadClientes();
  }

  getSortClass(field: string): string {
    if (this.sortField === field) {
      return this.sortDirection === 'asc' ? 'asc' : 'desc';
    }
    return '';
  }

  editCliente(id: number | undefined): void {
    if (id) {
      this.router.navigate(['/clientes/edit', id]);
    }
  }

  deleteCliente(id: number | undefined): void {
    if (id && confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
      this.clientePService.deleteCliente(id).subscribe({
        next: () => {
          alert('Cliente eliminado correctamente.');
          this.loadClientes();
        },
        error: (err) => {
          console.error('Error al eliminar cliente:', err);
          alert('Hubo un error al eliminar el cliente. Revisa la consola.');
        }
      });
    }
  }

  newCliente(): void {
    this.router.navigate(['/clientes/new']);
  }

  getPagesArray(totalPages: number): number[] {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  toggleClientStatus(cliente: ClienteP): void {
    if (!cliente.id) {
      console.error('ID de cliente no definido para alternar estado.');
      return;
    }

    const confirmMessage = cliente.estado
      ? '¿Estás seguro de que quieres INACTIVAR este cliente?'
      : '¿Estás seguro de que quieres ACTIVAR este cliente?';

    const successMessage = cliente.estado
      ? 'Cliente inactivado correctamente.'
      : 'Cliente activado correctamente.';

    const errorMessage = cliente.estado
      ? 'Hubo un error al inactivar el cliente.'
      : 'Hubo un error al activar el cliente.';

    if (confirm(confirmMessage)) {
      const actionObservable = cliente.estado
        ? this.clientePService.inactivateCliente(cliente.id)
        : this.clientePService.activateCliente(cliente.id);

      actionObservable.subscribe({
        next: () => {
          alert(successMessage);
          this.loadClientes();
        },
        error: (err) => {
          console.error(errorMessage, err);
          alert(`${errorMessage} Revisa la consola.`);
        }
      });
    }
  }
}
