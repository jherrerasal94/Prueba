import { Routes } from '@angular/router';
import { ClientePListComponent } from './components/cliente-p-list/cliente-p-list.component';
import { ClientePFormComponent } from './components/cliente-p-form/cliente-p-form.component';

export const routes: Routes = [
  { path: '', redirectTo: '/clientes', pathMatch: 'full' },
  { path: 'clientes', component: ClientePListComponent },
  { path: 'clientes/new', component: ClientePFormComponent },
  { path: 'clientes/edit/:id', component: ClientePFormComponent }
];