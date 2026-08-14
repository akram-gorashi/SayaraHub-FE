import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PageHero } from '../shared/page-hero';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-team-page',
  imports: [PageHero, TranslatePipe],
  templateUrl: './team-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamPage {
  protected readonly members = [
    { name: 'Chad Smith', role: 'content.team.operationsManager', image: '01.jpg' },
    { name: 'Malissa Fie', role: 'content.team.vehicleSpecialist', image: '02.jpg' },
    { name: 'Arron Rodri', role: 'content.team.founder', image: '03.jpg' },
    { name: 'Tony Pinto', role: 'content.team.customerExperience', image: '04.jpg' },
  ];
}
