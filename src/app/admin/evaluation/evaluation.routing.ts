import { Routes } from '@angular/router';
import { EvaluationListComponent } from './evaluation-list/evaluation-list.component';
import { QuestionAnswerComponent } from './question-answer/question-answer.component';
import { QuestionListComponent } from './question-list/question-list.component';

export const EvaluationRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'list',
        component: EvaluationListComponent,
        data: {
          title: 'Evaluaciones',
          routeName: 'evaluation',
          urls: [
            { label: 'Inicio', url: '/admin' },
            { label: 'Evaluaciones' },
          ],
        },
      },

      {
        path: 'list-question/:idEvaluation',
        component: QuestionListComponent,
        data: {
          title: 'Preguntas',
          routeName: 'question',
          urls: [
            { label: 'Inicio', url: '/admin' },
            { label: 'Evaluaciones', url: '/admin/evaluations/list' },
            { label: 'Preguntas' },
          ],
        },
      },

      {
        path: 'answer/:idEvaluation',
        component: QuestionAnswerComponent,
        data: {
          title: 'Respuestas',
          routeName: 'answer',
          urls: [
            { label: 'Inicio', url: '/admin' },
            // { label: 'Evaluaciones', url: '/admin/evaluations/list' },
            // { label: 'Preguntas', url: '/admin/evaluations/list-question/:idEvaluation'},
            { label: 'Crear pregunta' },
          ],
        },
      },

      {
        path: 'answer/:idEvaluation/:idQuestion',
        component: QuestionAnswerComponent,
        data: {
          title: 'Respuestas',
          routeName: 'answer',
          urls: [
            { label: 'Inicio', url: '/admin' },
            // { label: 'Administración' },
            // { label: 'Evaluaciones', url: '/admin/evaluations/list' },
            // { label: 'Preguntas', url: '/admin/evaluations/list-question/:idEvaluation/:idQuestion'},
            { label: 'Actualizar pregunta' },
          ],
        },
      },

      { path: '', redirectTo: 'list', pathMatch: 'full' },
    ],
  },
];
