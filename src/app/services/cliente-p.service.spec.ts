// src/app/services/cliente-p.service.spec.ts

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpParams } from '@angular/common/http'; // Importar HttpParams para construir URLs de prueba

import { ClientePService } from './cliente-p.service';
import { environment } from '../../environments/environment'; // Importa el entorno
import { ClienteP, ClientePQueryParams, PagedResult } from '../models/cliente-p.model'; // Importa tus modelos

describe('ClientePService', () => {
  let service: ClientePService;
  let httpTestingController: HttpTestingController; // Para controlar las solicitudes HTTP simuladas
  const apiUrl = `${environment.apiUrl}/ClientesPs`; // URL base para las pruebas

  beforeEach(() => {
    TestBed.configureTestingModule({
      // ¡IMPORTANTE! Importa HttpClientTestingModule aquí para simular HttpClient
      imports: [HttpClientTestingModule],
      // No necesitas proveer el servicio aquí si tiene `providedIn: 'root'`
      // providers: [ClientePService]
    });

    // Inyecta el servicio y el controlador de testing HTTP
    service = TestBed.inject(ClientePService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  // Este hook se ejecuta después de cada prueba.
  // Es crucial para verificar que no haya solicitudes HTTP pendientes
  // que no fueron "respondidas" por tus mocks.
  afterEach(() => {
    httpTestingController.verify();
  });

  // Prueba básica: Verificar que el servicio se crea correctamente
  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // Prueba para getClientes() sin parámetros
  it('should retrieve clients without query parameters', () => {
    const mockClients: ClienteP[] = [
      { id: 1, numId: '101', nombres: 'Ana', apellidos: 'Gomez', estado: true },
      { id: 2, numId: '102', nombres: 'Luis', apellidos: 'Perez', estado: true }
    ];
    const mockPagedResult: PagedResult<ClienteP> = {
      items: mockClients,
      totalCount: 2,
      pageNumber: 1,
      pageSize: 10, // Default pageSize en el backend
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false
    };

    service.getClientes().subscribe(result => {
      expect(result).toEqual(mockPagedResult);
      expect(result.items.length).toBe(2);
    });

    // Esperar una única solicitud GET a la URL base
    const req = httpTestingController.expectOne(apiUrl);
    expect(req.request.method).toEqual('GET');
    expect(req.request.params.toString()).toEqual(''); // Sin parámetros de consulta

    // Responder a la solicitud con los datos simulados
    req.flush(mockPagedResult);
  });

  // Prueba para getClientes() con parámetros de consulta
  it('should retrieve clients with query parameters', () => {
    const mockClients: ClienteP[] = [
      { id: 1, numId: '101', nombres: 'Ana', apellidos: 'Gomez', estado: true }
    ];
    const mockPagedResult: PagedResult<ClienteP> = {
      items: mockClients,
      totalCount: 1,
      pageNumber: 1,
      pageSize: 5,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false
    };

    const queryParams: ClientePQueryParams = {
      pageNumber: 1,
      pageSize: 5,
      sortField: 'Nombres',
      sortDirection: 'asc',
      nombres: 'Ana',
      estado: true
    };

    service.getClientes(queryParams).subscribe(result => {
      expect(result).toEqual(mockPagedResult);
      expect(result.items.length).toBe(1);
    });

    // Construir los parámetros de URL esperados manualmente para la verificación
    let expectedParams = new HttpParams()
      .append('pageNumber', '1')
      .append('pageSize', '5')
      .append('sortField', 'Nombres')
      .append('sortDirection', 'asc')
      .append('nombres', 'Ana')
      .append('estado', 'true');

    const req = httpTestingController.expectOne(`${apiUrl}?${expectedParams.toString()}`);
    expect(req.request.method).toEqual('GET');
    expect(req.request.params.toString()).toEqual(expectedParams.toString());

    req.flush(mockPagedResult);
  });

  // Prueba para getClienteById()
  it('should retrieve a client by ID', () => {
    const mockClient: ClienteP = { id: 1, numId: '101', nombres: 'Ana', apellidos: 'Gomez', correo: 'ana@test.com', estado: true };
    const clientId = 1;

    service.getClienteById(clientId).subscribe(client => {
      expect(client).toEqual(mockClient);
    });

    const req = httpTestingController.expectOne(`${apiUrl}/${clientId}`);
    expect(req.request.method).toEqual('GET');
    req.flush(mockClient);
  });

  // Prueba para createCliente()
  it('should create a new client', () => {
    const newClient: ClienteP = { numId: '103', nombres: 'Carlos', apellidos: 'Ruiz', correo: 'carlos@test.com', estado: true };
    const createdClient: ClienteP = { id: 3, ...newClient }; // Simula el ID asignado por el backend

    service.createCliente(newClient).subscribe(client => {
      expect(client).toEqual(createdClient);
    });

    const req = httpTestingController.expectOne(apiUrl);
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(newClient); // Verificar el cuerpo de la solicitud
    req.flush(createdClient);
  });

  // Prueba para updateCliente()
  it('should update an existing client', () => {
    const updatedClient: ClienteP = { id: 1, numId: '101', nombres: 'Ana Updated', apellidos: 'Gomez', correo: 'ana_upd@test.com', estado: true };
    const clientId = 1;

    service.updateCliente(clientId, updatedClient).subscribe(() => {
      // No hay valor de retorno para void, solo se completa el observable
      expect().nothing(); // Indica que no se espera un valor, solo que la operación se complete
    });

    const req = httpTestingController.expectOne(`${apiUrl}/${clientId}`);
    expect(req.request.method).toEqual('PUT');
    expect(req.request.body).toEqual(updatedClient);
    req.flush(null); // Para una respuesta void (204 No Content)
  });

  // Prueba para checkIfClienteExists()
  it('should check if a client exists', () => {
    const numId = '12345';
    service.checkIfClienteExists(numId).subscribe(exists => {
      expect(exists).toBeTrue();
    });

    const req = httpTestingController.expectOne(`${apiUrl}/Exists/${numId}`);
    expect(req.request.method).toEqual('GET');
    req.flush(true); // Simula que el cliente existe
  });

  // Prueba para inactivateCliente() (SoftDelete)
  it('should inactivate a client', () => {
    const clientId = 1;
    service.inactivateCliente(clientId).subscribe(() => {
      expect().nothing();
    });

    const req = httpTestingController.expectOne(`${apiUrl}/SoftDelete/${clientId}`);
    expect(req.request.method).toEqual('PUT');
    expect(req.request.body).toEqual({}); // Verificar que el cuerpo es vacío
    req.flush(null);
  });

  // Prueba para activateCliente()
  it('should activate a client', () => {
    const clientId = 1;
    service.activateCliente(clientId).subscribe(() => {
      expect().nothing();
    });

    const req = httpTestingController.expectOne(`${apiUrl}/Activate/${clientId}`);
    expect(req.request.method).toEqual('PUT');
    expect(req.request.body).toEqual({}); // Verificar que el cuerpo es vacío
    req.flush(null);
  });

  // Prueba de manejo de errores (ejemplo para getClientes)
  it('should handle error when getting clients', () => {
    const errorMessage = 'Test error';
    service.getClientes().subscribe({
      next: () => fail('should have failed with the 500 error'),
      error: (error) => {
        expect(error.status).toEqual(500);
        expect(error.statusText).toEqual('Internal Server Error');
      }
    });

    const req = httpTestingController.expectOne(apiUrl);
    req.error(new ProgressEvent('error'), { status: 500, statusText: 'Internal Server Error' });
  });

});
