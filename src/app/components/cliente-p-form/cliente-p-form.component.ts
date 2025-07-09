import { Component, OnInit } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientePService } from '../../services/cliente-p.service';
import { ClienteP } from '../../models/cliente-p.model';
import { CommonModule } from '@angular/common';
import { Observable, of } from 'rxjs';
import { map, catchError, debounceTime, distinctUntilChanged, switchMap, take } from 'rxjs/operators'; // Necesario para los operadores RxJS

@Component({
  selector: 'app-cliente-p-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule],
  templateUrl: './cliente-p-form.component.html',
  styleUrl: './cliente-p-form.component.css'
})
export class ClientePFormComponent implements OnInit {
  clienteForm: FormGroup;
  isEditMode: boolean = false;
  clienteId: number | null = null;
  private originalNumId: string | undefined;
  isCheckingNumId: boolean = false;

  constructor(
    private fb: FormBuilder,
    private clientePService: ClientePService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.clienteForm = this.fb.group({
      numId: [
        '',
        [Validators.required],
        [this.numIdExistsValidator()]
      ],
      nombres: ['', Validators.required],
      apellidos: ['', Validators.required],
      correo: ['', [Validators.email]],
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.clienteId = +id;
        this.loadCliente(this.clienteId);
      }
    });
    this.clienteForm.get('numId')?.statusChanges.subscribe(status => {
      this.isCheckingNumId = status === 'PENDING';
    });
  }

  loadCliente(id: number): void {
    this.clientePService.getClienteById(id).subscribe({
      next: (cliente) => {
        this.clienteForm.patchValue(cliente);
        this.originalNumId = cliente.numId;
      },
      error: (err) => {
        console.error('Error al cargar cliente para edición:', err);
        alert('Error al cargar los datos del cliente.');
        this.router.navigate(['/clientes']);
      }
    });
  }

  numIdExistsValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const numId = control.value;

      if (!numId || (this.isEditMode && numId === this.originalNumId)) {
        return of(null);
      }

      return control.valueChanges.pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap(value => {
          if (!value || (this.isEditMode && value === this.originalNumId)) {
            return of(null);
          }
          return this.clientePService.checkIfClienteExists(value).pipe(
            map(exists => (exists ? { numIdExists: true } : null)),
            catchError(() => of(null)),
            take(1)
          );
        }),
        take(1)
      );
    };
  }

  onSubmit(): void {
    if (this.clienteForm.invalid || this.isCheckingNumId) {
      this.clienteForm.markAllAsTouched();
      if (this.isCheckingNumId) {
        alert('Validando número de identificación, por favor espere.');
      }
      return;
    }

    const cliente: ClienteP = this.clienteForm.value;
    cliente.id = this.clienteId == undefined ? 0 : this.clienteId;
    cliente.estado = true;
    cliente.fechaCreacion = new Date();
    cliente.fechaModificacion = new Date();
    console.log(cliente);
    if (this.isEditMode && this.clienteId) {
      this.clientePService.updateCliente(this.clienteId, cliente).subscribe({
        next: () => {
          alert('Cliente actualizado correctamente.');
          this.router.navigate(['/clientes']);
        },
        error: (err) => {
          console.error('Error al actualizar cliente:', err);
          alert('Hubo un error al actualizar el cliente. Revisa la consola.');
        }
      });
    } else {
      this.clientePService.createCliente(cliente).subscribe({
        next: () => {
          alert('Cliente creado correctamente.');
          this.router.navigate(['/clientes']);
        },
        error: (err) => {
          console.error('Error al crear cliente:', err);
          if (err.error && err.error.includes('UNIQUE constraint failed')) {
            alert('Error: El Número de Identificación (NumId) ya existe.');
          } else {
            alert('Hubo un error al crear el cliente. Revisa la consola.');
          }
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/clientes']);
  }

  get numIdControl() {
    return this.clienteForm.get('numId');
  }
}
