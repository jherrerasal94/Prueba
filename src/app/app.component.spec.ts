// src/app/app.component.spec.ts

import { TestBed, ComponentFixture } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { RouterTestingModule } from '@angular/router/testing';
import { By } from '@angular/platform-browser';

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let component: AppComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AppComponent,
        RouterTestingModule
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // Dispara ngOnInit y renderiza el template inicial
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  // --- PRUEBA CORREGIDA: should have as title 'GESTIÓN DE CLIENTES' ---
  it(`should have as title 'GESTIÓN DE CLIENTES'`, () => { // ¡Ajusta el valor esperado aquí!
    expect(component.title).toEqual('GESTIÓN DE CLIENTES');
  });

  // --- PRUEBA CORREGIDA: should render title in the navbar brand ---
  it('should render title in the navbar brand', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    // ¡Ajusta el valor esperado aquí!
    expect(compiled.querySelector('.custom-brand')?.textContent).toContain('GESTIÓN DE CLIENTES');
  });

  // Puedes añadir más pruebas aquí si tu AppComponent tiene más lógica o interacciones.
});