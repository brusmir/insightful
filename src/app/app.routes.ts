import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';

export const routes: Routes = [
    { path: 'dashboard', component: DashboardComponent },
    // {
    //   path: 'vehicles',
    //   loadComponent: () =>
    //     import('./vehicles/vehicle-shell/vehicle-shell.component').then(c => c.VehicleShellComponent)
    // },
    // {
    //   path: 'cart',
    //   loadComponent: () =>
    //     import('./cart/cart-shell/cart-shell.component').then(c => c.CartShellComponent)
    // },
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    { path: '**', component: DashboardComponent }
  ];
