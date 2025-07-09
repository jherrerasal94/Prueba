// src/app/components/cliente-p-form/cliente-p-form.component.spec.ts

import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs'; // Importar 'of' y 'throwError'
import { FormBuilder } from '@angular/forms';

import { ClientePFormComponent } from './cliente-p-form.component';
import { ClientePService } from '../../services/cliente-p.service';
import { ClienteP } from '../../models/cliente-p.model';

describe('ClientePFormComponent', () => {
  let component: ClientePFormComponent;
  let fixture: ComponentFixture<ClientePFormComponent>;
  let clientePServiceSpy: jasmine.SpyObj<ClientePService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let activatedRouteMock: any;

  const mockClient: ClienteP = {
    id: 1,
    numId: '123456789',
    nombres: 'John',
    apellidos: 'Doe',
    correo: 'john.doe@example.com',
    estado: true,
    fechaCreacion: new Date('2023-01-01T10:00:00Z'),
    fechaModificacion: new Date('2023-01-01T10:00:00Z')
  };

  beforeEach(async () => {
    clientePServiceSpy = jasmine.createSpyObj('ClientePService', [
      'getClienteById',
      'createCliente',
      'updateCliente',
      'checkIfClienteExists'
    ]);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    activatedRouteMock = {
      paramMap: of(new Map())
    };

    clientePServiceSpy.getClienteById.and.returnValue(of(mockClient));
    clientePServiceSpy.checkIfClienteExists.and.returnValue(of(false)); // Default to not existing
    clientePServiceSpy.createCliente.and.returnValue(of({ ...mockClient, id: 99 } as ClienteP));
    clientePServiceSpy.updateCliente.and.returnValue(of(undefined));

    spyOn(window, 'alert');
    spyOn(console, 'error');

    await TestBed.configureTestingModule({
      imports: [
        ClientePFormComponent
      ],
      providers: [
        { provide: ClientePService, useValue: clientePServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRouteMock },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ClientePFormComponent);
    component = fixture.componentInstance;
  });

  it('should create', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    expect(component).toBeTruthy();
  }));

  it('should initialize form in creation mode by default', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    expect(component.isEditMode).toBeFalsy();
    expect(component.clienteId).toBeNull();
    expect(component.clienteForm.value).toEqual({
      numId: '', nombres: '', apellidos: '', correo: ''
    });
  }));

  it('should load client data in edit mode', fakeAsync(() => {
    activatedRouteMock.paramMap = of(new Map([['id', '1']]));
    clientePServiceSpy.getClienteById.and.returnValue(of(mockClient));

    fixture = TestBed.createComponent(ClientePFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick();

    expect(component.isEditMode).toBeTruthy();
    expect(component.clienteId).toBe(1);
    expect(clientePServiceSpy.getClienteById).toHaveBeenCalledWith(1);
    expect(component.clienteForm.value.nombres).toBe(mockClient.nombres);
    expect(component['originalNumId']).toBe(mockClient.numId);
  }));

  it('should handle error when loading client for edit', fakeAsync(() => {
    activatedRouteMock.paramMap = of(new Map([['id', '999']]));
    const errorResponse = new Error('Client not found');
    clientePServiceSpy.getClienteById.and.returnValue(throwError(() => errorResponse));

    fixture = TestBed.createComponent(ClientePFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick();

    expect(console.error).toHaveBeenCalledWith('Error al cargar cliente para edición:', errorResponse);
    expect(window.alert).toHaveBeenCalledWith('Error al cargar los datos del cliente.');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/clientes']);
  }));

  it('should call createCliente on onSubmit in creation mode', fakeAsync(() => {
    fixture.detectChanges();

    component.clienteForm.patchValue({
      numId: 'NEWID123',
      nombres: 'Nuevo',
      apellidos: 'Cliente',
      correo: 'nuevo@example.com'
    });

    tick(500);

    expect(clientePServiceSpy.checkIfClienteExists).toHaveBeenCalledWith('NEWID123');
    expect(component.clienteForm.get('numId')?.status).toBe('VALID');
    expect(component.isCheckingNumId).toBeFalsy();
    expect(component.clienteForm.valid).toBeTruthy();

    component.onSubmit();

    expect(clientePServiceSpy.createCliente).toHaveBeenCalledTimes(1);
    expect(clientePServiceSpy.createCliente).toHaveBeenCalledWith(jasmine.objectContaining({
      numId: 'NEWID123',
      nombres: 'Nuevo',
      apellidos: 'Cliente',
      correo: 'nuevo@example.com',
      id: 0,
      estado: true,
      fechaCreacion: jasmine.any(Date),
      fechaModificacion: jasmine.any(Date)
    }));
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/clientes']);
    expect(window.alert).toHaveBeenCalledWith('Cliente creado correctamente.');

    tick();
  }));

  it('should call updateCliente on onSubmit in edit mode', fakeAsync(() => {
    component.isEditMode = true;
    component.clienteId = mockClient.id!;
    component['originalNumId'] = mockClient.numId;

    fixture.detectChanges();
    tick(); // Para asegurar que ngOnInit y sus suscripciones se resuelvan

    component.clienteForm.patchValue({
      numId: mockClient.numId,
      nombres: 'John Edited',
      apellidos: 'Doe Edited',
      correo: 'john.edited@example.com'
    });

    // No tick(500) necesario si numId no cambia y el validador asíncrono no se dispara
    // Si el numId cambiara en esta prueba, sí necesitaríamos tick(500)

    expect(component.clienteForm.valid).toBeTruthy();

    component.onSubmit();

    expect(clientePServiceSpy.updateCliente).toHaveBeenCalledTimes(1);
    expect(clientePServiceSpy.updateCliente).toHaveBeenCalledWith(mockClient.id!, jasmine.objectContaining({
      numId: mockClient.numId,
      nombres: 'John Edited',
      apellidos: 'Doe Edited',
      correo: 'john.edited@example.com',
      id: mockClient.id,
      estado: true,
      fechaCreacion: jasmine.any(Date),
      fechaModificacion: jasmine.any(Date)
    }));
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/clientes']);
    expect(window.alert).toHaveBeenCalledWith('Cliente actualizado correctamente.');

    tick();
  }));

  // --- PRUEBA CORREGIDA: should not call createCliente on onSubmit if numId already exists (async validation) ---
  it('should not call createCliente on onSubmit if numId already exists (async validation)', fakeAsync(() => {
    fixture.detectChanges(); // Inicializa el componente y sus suscripciones

    // Configurar el spy para que checkIfClienteExists devuelva true (existe)
    clientePServiceSpy.checkIfClienteExists.and.returnValue(of(true));

    const numIdControl = component.clienteForm.get('numId');
    // Setear valores válidos para otros campos para que la invalidez sea solo por numId
    component.clienteForm.patchValue({
      nombres: 'Valid',
      apellidos: 'User',
      correo: 'valid@example.com'
    });

    numIdControl?.setValue('EXISTINGID'); // Esto dispara el validador asíncrono
    fixture.detectChanges(); // Permite que el statusChanges del control se actualice a PENDING
    expect(numIdControl?.status).toBe('PENDING'); // Verifica que pasa a PENDING
    expect(component.isCheckingNumId).toBeTrue(); // Verifica que la bandera es true

    tick(500); // Avanzar el tiempo para que el debounceTime y la llamada al servicio se resuelvan
    fixture.detectChanges(); // Permite que el statusChanges se actualice a INVALID

    // Después de tick(500), el validador asíncrono ya resolvió y encontró que existe.
    // El control debería ser inválido por 'numIdExists' y no estar pendiente.
    expect(numIdControl?.hasError('numIdExists')).toBeTruthy();
    expect(numIdControl?.status).toBe('INVALID'); // El estado debería ser INVALID ahora
    expect(component.isCheckingNumId).toBeFalsy(); // La bandera debería ser false ahora

    // El formulario completo debería ser inválido debido al control 'numId'
    expect(component.clienteForm.invalid).toBeTruthy();

    component.onSubmit(); // Llamar a onSubmit

    // Aserciones:
    expect(clientePServiceSpy.createCliente).not.toHaveBeenCalled(); // NO debe llamar a createCliente
    expect(routerSpy.navigate).not.toHaveBeenCalled(); // NO debe navegar

    // IMPORTANTE: El alert 'Validando...' NO debe ser llamado en este escenario,
    // porque `isCheckingNumId` es `false` cuando el validador ya ha resuelto.
    expect(window.alert).not.toHaveBeenCalledWith('Validando número de identificación, por favor espere.');

    tick(); // Drenar microtareas
  }));

  // Prueba: No llamar a createCliente si el formulario es inválido (validación síncrona)
  it('should not call createCliente on onSubmit if form is invalid (sync validation)', fakeAsync(() => {
    fixture.detectChanges();
    component.clienteForm.patchValue({
      numId: 'VALIDID',
      nombres: '', // Requerido
      apellidos: '' // Requerido
    });
    clientePServiceSpy.checkIfClienteExists.and.returnValue(of(false));
    tick(500);

    expect(component.clienteForm.invalid).toBeTruthy();
    expect(component.isCheckingNumId).toBeFalsy();

    component.onSubmit();

    expect(clientePServiceSpy.createCliente).not.toHaveBeenCalled();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
    expect(window.alert).not.toHaveBeenCalled(); // No debería mostrar alert de éxito
    tick();
  }));

  // Prueba: No llamar a createCliente si la validación asíncrona está pendiente
  it('should not call createCliente on onSubmit if isCheckingNumId is true (pending state)', fakeAsync(() => {
    fixture.detectChanges();

    const numIdControl = component.clienteForm.get('numId');
    numIdControl?.setValue('PENDINGID');

    tick(100); // Avanza solo una parte del tiempo para que el debounce no se complete

    expect(numIdControl?.status).toBe('PENDING');
    expect(component.isCheckingNumId).toBeTrue();

    component.onSubmit();

    expect(clientePServiceSpy.createCliente).not.toHaveBeenCalled();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith('Validando número de identificación, por favor espere.');

    tick(400); // Avanza el tiempo restante del debounce
    expect(numIdControl?.status).toBe('VALID');
    expect(component.isCheckingNumId).toBeFalsy();
    tick();
  }));

  it('should navigate back on goBack()', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    component.goBack();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/clientes']);
  }));

  it('should return numIdControl', () => {
    expect(component.numIdControl).toBe(component.clienteForm.get('numId'));
  });
});
