import { Component } from '@angular/core';
import { NgIconComponent } from '@ng-icons/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [NgIconComponent],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.sass',
})
export class HomePageComponent {
  constructor(private router: Router) {}

  onQueueButtonClick() {
    this.router.navigate(['queue']);
  }
}
