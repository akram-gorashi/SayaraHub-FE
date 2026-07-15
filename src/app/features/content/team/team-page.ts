import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PageHero } from '../shared/page-hero';

@Component({
  selector: 'app-team-page',
  imports: [PageHero],
  templateUrl: './team-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamPage {
  protected readonly members = [
    { name: 'Chad Smith', role: 'Operations Manager', image: '01.jpg' },
    { name: 'Malissa Fie', role: 'Vehicle Specialist', image: '02.jpg' },
    { name: 'Arron Rodri', role: 'Founder & CEO', image: '03.jpg' },
    { name: 'Tony Pinto', role: 'Customer Experience', image: '04.jpg' },
  ];
}
