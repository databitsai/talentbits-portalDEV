import { Routes } from "@angular/router";
import { UserEvaluationIntroductionComponent } from "./user-evaluation-introduction/user-evaluation-introduction.component";
import { UserProcessEvaluationsComponent } from "./user-process-evaluations/user-process-evaluations.component";
import { UserProcessListComponent } from "./user-process-list/user-process-list.component";

export const UserProcessRoutes: Routes = [
    {
        path: '',
        children: [
            {
                path: 'main',
                component: UserProcessListComponent,
                data: {
                    title: 'Mis Procesos',
                    routeName: 'main',
                    urls: [
                        { label: 'Inicio', url: '/' },
                        { label: 'Mis Procesos' },
                    ]
                }
            },
            {
                path: 'evaluations',
                component: UserProcessEvaluationsComponent,
                data: {
                    title: 'Mis Procesos: Evaluaciones',
                    routeName: 'main',
                    urls: [
                        { label: 'Inicio', url: '/' },
                        { label: 'Mis Procesos', url: '/user/process/main' },
                        { label: 'Evaluaciones' },
                    ]
                }
            },
            {
                path: 'evaluations/introduction',
                component: UserEvaluationIntroductionComponent,
                data: {
                    title: 'Evaluación: Introducción',
                    routeName: 'main',
                    urls: [
                        { label: 'Inicio', url: '/' },
                        { label: 'Mis Procesos', url: '/user/process/main' },
                        { label: 'Evaluaciones',  url: '/user/process/evaluations' },
                        { label: 'Introducción'}
                    ]
                }
            },
            { path: '', redirectTo: 'main', pathMatch: 'prefix' }
        ]
    }
];