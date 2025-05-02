import { Routes } from "@angular/router";
import { JobOpportunitiesComponent } from "./job-opportunities/job-opportunities.component";
import { JobSelectedComponent } from "./job-selected/job-selected.component";


export const JobOpportunitiesRoutes: Routes = [
    {
        path: '',
        children: [
            {
                path: 'main',
                component: JobOpportunitiesComponent,
                data: {
                    title: 'Bolsa de trabajo',
                    routeName: 'main',
                    urls: [
                        { label: 'Inicio', url: '/' },
                        { label: 'Bolsa de trabajo' },
                    ]
                }
            },
            {
                path: 'selected',
                component: JobSelectedComponent,
                data: {
                    title: 'Bolsa de trabajo: Vacante',
                    routeName: 'selected',
                    urls: [
                        { label: 'Inicio', url: '/' },
                        { label: 'Bolsa de trabajo', url: '/user/job' },
                        { label: 'Vacante' },
                    ]
                }
            },
            { path: '', redirectTo: 'main', pathMatch: 'prefix' }
        ]
    }

];