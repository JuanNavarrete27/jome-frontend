import { Routes } from '@angular/router';
import { LandingPageComponent } from './pages/landing/landing.page';

export const routes: Routes = [
  { path: '', component: LandingPageComponent }, // ✅ HOME
  { path: '**', redirectTo: '' }
];
