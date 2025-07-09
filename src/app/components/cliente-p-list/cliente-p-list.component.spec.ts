// src/app/components/cliente-p-list/cliente-p-list.component.spec.ts

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router'; // Importar Router para mockearlo
import { of, throwError } from 'rxjs'; // Importar 'of' y 'throwError' para Observables de mocks
import { FormBuilder } from '@angular/forms'; // Importar FormBuilder

import { ClientePListComponent } from './cliente-p-list.component';
import { ClientePService } from '../../services/cliente-p.service'; // Importar tu servicio
import { ClienteP, PagedResult, ClientePQueryParams } from '../../models/cliente-p.model'; // Importar modelos y query params

describe('ClientePListComponent', () => {
  let component: ClientePListComponent;
  let fixture: ComponentFixture<ClientePListComponent>;
  let clientePServiceSpy: jasmine.SpyObj<ClientePService>; // Para espiar tu servicio
  let routerSpy: jasmine.SpyObj<Router>; // Para espiar el Router

  // Datos de mock para clientes y paginación
  const mockClientsPage1: ClienteP[] = [
    { id: 1, numId: 'ID001', nombres: 'Ana', apellidos: 'Gomez', correo: 'ana@example.com', estado: true, fechaCreacion: new Date(), fechaModificacion: new Date() },
    { id: 2, numId: 'ID002', nombres: 'Luis', apellidos: 'Perez', correo: 'luis@example.com', estado: true, fechaCreacion: new Date(), fechaModificacion: new Date() },
    { id: 3, numId: 'ID003', nombres: 'Maria', apellidos: 'Lopez', correo: 'maria@example.com', estado: true, fechaCreacion: new Date(), fechaModificacion: new Date() },
    { id: 4, numId: 'ID004', nombres: 'Pedro', apellidos: 'Diaz', correo: 'pedro@example.com', estado: true, fechaCreacion: new Date(), fechaModificacion: new Date() },
    { id: 5, numId: 'ID005', nombres: 'Sofia', apellidos: 'Ruiz', correo: 'sofia@example.com', estado: true, fechaCreacion: new Date(), fechaModificacion: new Date() },
  ];
  const mockClientsPage2: ClienteP[] = [
    { id: 6, numId: 'ID006', nombres: 'Carlos', apellidos: 'Hernandez', correo: 'carlos@example.com', estado: true, fechaCreacion: new Date(), fechaModificacion: new Date() },
    { id: 7, numId: 'ID007', nombres: 'Laura', apellidos: 'Martinez', correo: 'laura@example.com', estado: true, fechaCreacion: new Date(), fechaModificacion: new Date() },
  ];

  const mockPagedResultPage1: PagedResult<ClienteP> = {
    items: mockClientsPage1,
    totalCount: 7, // Total de clientes para 2 páginas (5 en P1, 2 en P2)
    pageNumber: 1,
    pageSize: 5,
    totalPages: 2,
    hasPreviousPage: false,
    hasNextPage: true
  };

  const mockPagedResultPage2: PagedResult<ClienteP> = {
    items: mockClientsPage2,
    totalCount: 7,
    pageNumber: 2,
    pageSize: 5,
    totalPages: 2,
    hasPreviousPage: true,
    hasNextPage: false
  };

  const emptyPagedResult: PagedResult<ClienteP> = {
    items: [],
    pageNumber: 1,
    pageSize: 5,
    totalCount: 0,
    totalPages: 0,
    hasPreviousPage: false,
    hasNextPage: false
  };


  beforeEach(async () => {
    // 1. Crear los objetos espía (mocks) para los servicios
    clientePServiceSpy = jasmine.createSpyObj('ClientePService', [
      'getClientes',
      'deleteCliente', // Aunque ya no se usa directamente, mantenerlo si está en el spyObj
      'inactivateCliente',
      'activateCliente'
    ]);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    // Configurar un valor de retorno por defecto para getClientes
    // Esto es crucial para que ngOnInit no falle al intentar cargar clientes
    clientePServiceSpy.getClientes.and.returnValue(of(emptyPagedResult));

    await TestBed.configureTestingModule({
      // Si ClientePListComponent es standalone, se importa directamente aquí.
      // Sus 'imports' (CommonModule, ReactiveFormsModule) se resolverán automáticamente
      // al importar el propio componente standalone.
      imports: [
        ClientePListComponent
      ],
      // Proveer los servicios que el componente inyecta
      providers: [
        { provide: ClientePService, useValue: clientePServiceSpy },
        { provide: Router, useValue: routerSpy },
        // FormBuilder está provisto por ReactiveFormsModule (importado por ClientePListComponent)
      ]
    })
    .compileComponents(); // Compila el componente para las pruebas

    fixture = TestBed.createComponent(ClientePListComponent);
    component = fixture.componentInstance;

    // Mockear window.confirm y window.alert para evitar que abran popups durante las pruebas
    spyOn(window, 'confirm').and.returnValue(true); // Siempre confirma para toggleClientStatus
    spyOn(window, 'alert'); // Espía alert para verificar los mensajes
    spyOn(console, 'error'); // Espía console.error para verificar errores logueados
  });

  // Prueba básica: Verificar que el componente se crea correctamente
  it('should create', fakeAsync(() => {
    fixture.detectChanges(); // Dispara ngOnInit
    tick(); // Resuelve el Observable de getClientes en ngOnInit
    expect(component).toBeTruthy();
  }));

  // Prueba: Verificar que los clientes se cargan al inicializar el componente
  it('should load clients on init', fakeAsync(() => {
    clientePServiceSpy.getClientes.and.returnValue(of(mockPagedResultPage1)); // Configurar mock para esta prueba

    fixture.detectChanges(); // Dispara ngOnInit
    tick(); // Resuelve el Observable de getClientes

    expect(clientePServiceSpy.getClientes).toHaveBeenCalledTimes(1);
    expect(component.clientes).toEqual(mockClientsPage1);
    expect(component.pagedResult).toEqual(mockPagedResultPage1);
  }));

  // Prueba: Verificar la navegación al formulario de nuevo cliente
  it('should navigate to new client form on newCliente()', () => {
    component.newCliente();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/clientes/new']);
  });

  // Prueba: Verificar la paginación a una página específica
  it('should go to specified page', fakeAsync(() => {
    // Configurar el spy para simular respuestas diferentes según los parámetros de la llamada
    clientePServiceSpy.getClientes.and.callFake((queryParams?: ClientePQueryParams) => {
      if (queryParams?.pageNumber === 1) {
        return of(mockPagedResultPage1);
      } else if (queryParams?.pageNumber === 2) {
        return of(mockPagedResultPage2);
      }
      return of(emptyPagedResult); // En caso de cualquier otra llamada inesperada
    });

    // 1. Disparar ngOnInit y resolver la primera llamada a getClientes (página 1)
    fixture.detectChanges(); // Dispara ngOnInit
    tick(); // Resuelve la llamada a getClientes para la página 1

    // Verificar el estado inicial después de la primera carga
    expect(component.currentPage).toBe(1);
    expect(component.pagedResult?.totalPages).toBe(2);
    expect(clientePServiceSpy.getClientes).toHaveBeenCalledTimes(1);
    expect(component.clientes).toEqual(mockClientsPage1);

    // 2. Llamar a goToPage(2) para navegar a la segunda página
    component.goToPage(2);
    tick(); // Resuelve la llamada a getClientes para la página 2

    // 3. Realizar las aserciones para la página 2
    expect(component.currentPage).toBe(2);
    expect(clientePServiceSpy.getClientes).toHaveBeenCalledTimes(2); // Una vez en ngOnInit, otra en goToPage
    expect(clientePServiceSpy.getClientes).toHaveBeenCalledWith(jasmine.objectContaining({ pageNumber: 2 }));
    expect(component.clientes.length).toBe(mockClientsPage2.length);
    expect(component.clientes).toEqual(mockClientsPage2);

    tick(); // Drenar cualquier microtarea pendiente
  }));

  // Prueba: Verificar el cambio de tamaño de página
  it('should change page size and reset to first page', fakeAsync(() => {
    // Configurar el spy para simular respuestas diferentes según los parámetros de la llamada
    clientePServiceSpy.getClientes.and.callFake((queryParams?: ClientePQueryParams) => {
      if (queryParams?.pageSize === 5) {
        return of(mockPagedResultPage1);
      } else if (queryParams?.pageSize === 10) {
        // Crear un mock PagedResult para pageSize 10
        const mockPagedResultSize10: PagedResult<ClienteP> = {
          items: [...mockClientsPage1, ...mockClientsPage2], // Todos los clientes en una página
          totalCount: 7,
          pageNumber: 1,
          pageSize: 10,
          totalPages: 1,
          hasPreviousPage: false,
          hasNextPage: false
        };
        return of(mockPagedResultSize10);
      }
      return of(emptyPagedResult);
    });

    fixture.detectChanges(); // ngOnInit
    tick();

    expect(component.pageSize).toBe(5); // Tamaño de página inicial
    expect(component.currentPage).toBe(1);

    // Simular evento de cambio en el select
    const event = { target: { value: '10' } } as unknown as Event;
    component.onPageSizeChange(event);
    tick(); // Resuelve la llamada a getClientes

    expect(component.pageSize).toBe(10);
    expect(component.currentPage).toBe(1); // Debe resetear a la primera página
    expect(clientePServiceSpy.getClientes).toHaveBeenCalledTimes(2); // Una en ngOnInit, otra en onPageSizeChange
    expect(clientePServiceSpy.getClientes).toHaveBeenCalledWith(jasmine.objectContaining({ pageSize: 10, pageNumber: 1 }));
  }));

  // Prueba: Verificar el ordenamiento por campo
  it('should sort clients by field and direction', fakeAsync(() => {
    clientePServiceSpy.getClientes.and.returnValue(of(mockPagedResultPage1)); // Mock inicial
    fixture.detectChanges(); // ngOnInit
    tick();

    expect(component.sortField).toBe('Id');
    expect(component.sortDirection).toBe('asc');

    // Ordenar por Nombres (primera vez, debería ser 'asc')
    component.sortBy('Nombres');
    tick(); // Resuelve la llamada a getClientes

    expect(component.sortField).toBe('Nombres');
    expect(component.sortDirection).toBe('asc');
    expect(clientePServiceSpy.getClientes).toHaveBeenCalledTimes(2);
    expect(clientePServiceSpy.getClientes).toHaveBeenCalledWith(jasmine.objectContaining({ sortField: 'Nombres', sortDirection: 'asc' }));

    // Ordenar por Nombres de nuevo (debería cambiar a 'desc')
    component.sortBy('Nombres');
    tick(); // Resuelve la llamada a getClientes

    expect(component.sortField).toBe('Nombres');
    expect(component.sortDirection).toBe('desc');
    expect(clientePServiceSpy.getClientes).toHaveBeenCalledTimes(3);
    expect(clientePServiceSpy.getClientes).toHaveBeenCalledWith(jasmine.objectContaining({ sortField: 'Nombres', sortDirection: 'desc' }));
  }));

  // Prueba: Verificar la navegación a editar cliente
  it('should navigate to edit client form on editCliente()', () => {
    const clientId = 1;
    component.editCliente(clientId);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/clientes/edit', clientId]);
  });

  // Prueba: Verificar el cambio de estado a INACTIVAR
  it('should inactivate a client when toggleClientStatus is called for an active client', fakeAsync(() => {
    // Configurar getClientes para la carga inicial y la recarga después de la acción
    clientePServiceSpy.getClientes.and.returnValues(of(emptyPagedResult), of(emptyPagedResult)); // 2 llamadas esperadas

    fixture.detectChanges(); // ngOnInit (1ra llamada a getClientes)
    tick(); // Resuelve la 1ra llamada

    const activeClient: ClienteP = { id: 1, numId: 'ID001', nombres: 'Active', apellidos: 'Client', estado: true };
    clientePServiceSpy.inactivateCliente.and.returnValue(of(undefined)); // Simula éxito

    component.toggleClientStatus(activeClient);
    tick(); // Resuelve la llamada a inactivateCliente
    tick(); // Resuelve la 2da llamada a loadClientes (que llama a getClientes)

    expect(window.confirm).toHaveBeenCalledWith('¿Estás seguro de que quieres INACTIVAR este cliente?');
    expect(clientePServiceSpy.inactivateCliente).toHaveBeenCalledWith(activeClient.id!);
    expect(window.alert).toHaveBeenCalledWith('Cliente inactivado correctamente.');
    expect(clientePServiceSpy.getClientes).toHaveBeenCalledTimes(2); // Una en ngOnInit, otra después de la acción
  }));

  // Prueba: Verificar el cambio de estado a ACTIVAR
  it('should activate a client when toggleClientStatus is called for an inactive client', fakeAsync(() => {
    // Configurar getClientes para la carga inicial y la recarga después de la acción
    clientePServiceSpy.getClientes.and.returnValues(of(emptyPagedResult), of(emptyPagedResult)); // 2 llamadas esperadas

    fixture.detectChanges(); // ngOnInit (1ra llamada a getClientes)
    tick(); // Resuelve la 1ra llamada

    const inactiveClient: ClienteP = { id: 1, numId: 'ID001', nombres: 'Inactive', apellidos: 'Client', estado: false };
    clientePServiceSpy.activateCliente.and.returnValue(of(undefined)); // Simula éxito

    component.toggleClientStatus(inactiveClient);
    tick(); // Resuelve la llamada a activateCliente
    tick(); // Resuelve la 2da llamada a loadClientes (que llama a getClientes)

    expect(window.confirm).toHaveBeenCalledWith('¿Estás seguro de que quieres ACTIVAR este cliente?');
    expect(clientePServiceSpy.activateCliente).toHaveBeenCalledWith(inactiveClient.id!);
    expect(window.alert).toHaveBeenCalledWith('Cliente activado correctamente.');
    expect(clientePServiceSpy.getClientes).toHaveBeenCalledTimes(2);
  }));

  // Prueba: Manejo de error al cargar clientes
  it('should handle error when loading clients', fakeAsync(() => {
    const errorResponse = new Error('Test error');
    clientePServiceSpy.getClientes.and.returnValue(throwError(() => errorResponse)); // Simula un error

    fixture.detectChanges(); // Dispara ngOnInit
    tick(); // Resuelve el Observable con error

    expect(console.error).toHaveBeenCalledWith('Error al cargar clientes:', errorResponse);
    expect(window.alert).toHaveBeenCalledWith('Hubo un error al cargar los clientes. Revisa la consola.');
    expect(component.clientes).toEqual([]); // La lista debe estar vacía
    expect(component.pagedResult).toBeUndefined(); // El resultado paginado debe ser undefined
  }));

  // Prueba: Manejo de error al cambiar estado del cliente
  it('should handle error when toggling client status', fakeAsync(() => {
    // Configurar getClientes para la carga inicial (solo 1 llamada esperada en este escenario)
    clientePServiceSpy.getClientes.and.returnValue(of(emptyPagedResult));

    fixture.detectChanges(); // Dispara ngOnInit (1ra llamada a getClientes)
    tick(); // Resuelve la 1ra llamada

    const clientToToggle: ClienteP = { id: 1, numId: 'ID001', nombres: 'Test', apellidos: 'Client', estado: true };
    const errorResponse = new Error('Toggle error');
    clientePServiceSpy.inactivateCliente.and.returnValue(throwError(() => errorResponse)); // Simula error en inactivate

    component.toggleClientStatus(clientToToggle);
    tick(); // Resuelve el Observable con error (inactivateCliente)

    expect(window.confirm).toHaveBeenCalled(); // Confirmación se muestra
    expect(clientePServiceSpy.inactivateCliente).toHaveBeenCalledWith(clientToToggle.id!);
    expect(console.error).toHaveBeenCalledWith('Hubo un error al inactivar el cliente.', errorResponse);
    expect(window.alert).toHaveBeenCalledWith('Hubo un error al inactivar el cliente. Revisa la consola.');
    expect(clientePServiceSpy.getClientes).toHaveBeenCalledTimes(1); // No debería recargar si hay error en la acción

    tick(); // Drenar cualquier microtarea pendiente
  }));

  // Prueba para getPagesArray
  it('getPagesArray should return an array of page numbers', () => {
    expect(component.getPagesArray(0)).toEqual([]);
    expect(component.getPagesArray(1)).toEqual([1]);
    expect(component.getPagesArray(3)).toEqual([1, 2, 3]);
  });

  // Prueba para getSortClass
  it('getSortClass should return correct class for sorting', () => {
    component.sortField = 'Nombres';
    component.sortDirection = 'asc';
    expect(component.getSortClass('Nombres')).toBe('asc');

    component.sortDirection = 'desc';
    expect(component.getSortClass('Nombres')).toBe('desc');

    expect(component.getSortClass('Apellidos')).toBe(''); // Not sorted by this field
  });

  // Prueba para el filtrado de clientes
  it('should filter clients and reset to first page', fakeAsync(() => {
    // Configurar el spy para simular respuestas diferentes según los parámetros de la llamada
    clientePServiceSpy.getClientes.and.callFake((queryParams?: ClientePQueryParams) => {
      if (queryParams?.nombres === 'Ana') {
        const filteredResult: PagedResult<ClienteP> = {
          items: [mockClientsPage1[0]], // Solo Ana
          totalCount: 1, pageNumber: 1, pageSize: 5, totalPages: 1, hasPreviousPage: false, hasNextPage: false
        };
        return of(filteredResult);
      }
      return of(emptyPagedResult);
    });

    fixture.detectChanges(); // ngOnInit
    tick(); // Resuelve la primera llamada

    expect(clientePServiceSpy.getClientes).toHaveBeenCalledTimes(1);

    // Simular cambio en el campo de nombres del filtro
    component.filterForm.get('nombres')?.setValue('Ana');
    tick(300); // Avanzar el debounceTime
    tick(); // Resolver la llamada al servicio

    expect(component.currentPage).toBe(1); // Debe resetear a la primera página
    expect(clientePServiceSpy.getClientes).toHaveBeenCalledTimes(2); // Una en ngOnInit, otra por el filtro
    expect(clientePServiceSpy.getClientes).toHaveBeenCalledWith(jasmine.objectContaining({ nombres: 'Ana', pageNumber: 1 }));
    expect(component.clientes).toEqual([mockClientsPage1[0]]); // Verificar que los clientes filtrados se cargaron
  }));

  // Prueba para el filtro de estado
  it('should filter clients by status', fakeAsync(() => {
    const activeClient: ClienteP = { id: 1, numId: 'A', nombres: 'Active', apellidos: 'Client', estado: true };
    const inactiveClient: ClienteP = { id: 2, numId: 'I', nombres: 'Inactive', apellidos: 'Client', estado: false };

    clientePServiceSpy.getClientes.and.callFake((queryParams?: ClientePQueryParams) => {
      if (queryParams?.estado === true) {
        return of({ items: [activeClient], totalCount: 1, pageNumber: 1, pageSize: 5, totalPages: 1, hasPreviousPage: false, hasNextPage: false });
      } else if (queryParams?.estado === false) {
        return of({ items: [inactiveClient], totalCount: 1, pageNumber: 1, pageSize: 5, totalPages: 1, hasPreviousPage: false, hasNextPage: false });
      } else if (queryParams?.estado === null) {
        return of({ items: [activeClient, inactiveClient], totalCount: 2, pageNumber: 1, pageSize: 5, totalPages: 1, hasPreviousPage: false, hasNextPage: false });
      }
      return of(emptyPagedResult);
    });

    fixture.detectChanges(); // ngOnInit (llamada inicial con estado: true)
    tick();

    expect(component.clientes).toEqual([activeClient]); // Por defecto, solo activos

    // Cambiar filtro a Inactivo
    component.filterForm.get('estado')?.setValue(false);
    tick(300); // Debounce
    tick();

    expect(component.clientes).toEqual([inactiveClient]);
    expect(clientePServiceSpy.getClientes).toHaveBeenCalledWith(jasmine.objectContaining({ estado: false }));

    // Cambiar filtro a Todos
    component.filterForm.get('estado')?.setValue(null);
    tick(300); // Debounce
    tick();

    expect(component.clientes).toEqual([activeClient, inactiveClient]);
    expect(clientePServiceSpy.getClientes).toHaveBeenCalledWith(jasmine.objectContaining({ estado: null }));
  }));

});
