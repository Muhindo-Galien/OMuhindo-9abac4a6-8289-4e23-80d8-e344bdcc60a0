import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  selector: 'app-root',
  template: `
    <div class="min-h-screen bg-gray-50">
      <router-outlet></router-outlet>
    </div>
  `,
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'dashboard';
}
