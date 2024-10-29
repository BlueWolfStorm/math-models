import { Routes } from '@angular/router';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { QueuePageComponent } from './pages/queue-page/queue-page.component';

export const routes: Routes = [
  { path: '', component: HomePageComponent },
  { path: 'queue', component: QueuePageComponent },
  { path: '**', redirectTo: '' },
];
