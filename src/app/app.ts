import { afterNextRender, Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from "./core/layout/header/header";
import { Footer } from "./core/layout/footer/footer";

@Component({
  selector: 'app-root',
  imports: [Header, RouterOutlet, Footer],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('sayara-hub-FE');

  constructor() {
    afterNextRender(() => {
      const themeScript = document.createElement('script');
      themeScript.src = 'assets/js/main.js';
      themeScript.dataset['themeInitializer'] = 'true';
      document.body.appendChild(themeScript);
    });
  }
}
