import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ConfirmationService } from 'primeng/api';
import { ResponseApi } from 'src/app/_models/ResponseApi';
import { UserProcessApiService } from 'src/app/_services/api/user-process-api.service';
import { CustomToastService } from 'src/app/_services/common/custom-toast.service';
import { StorageService } from 'src/app/_services/security/storage.service';
import { PROCESS_USER_SELECTED_EVALUATION, PROCESS_USER_SELECTED_ROUTE, STORAGE_LOCAL } from 'src/app/_utils/constants';

interface ProcessSelcted {
  id: number;
  idUserProcess: number;
  name: string;
  validUntil: any;
}

@Component({
  selector: 'app-user-evaluation-introduction',
  templateUrl: './user-evaluation-introduction.component.html',
  styleUrls: ['./user-evaluation-introduction.component.scss']
})
export class UserEvaluationIntroductionComponent implements OnInit {

  checked: boolean = false;
  process: ProcessSelcted = Object.create({});
  evaluation: any = Object.create({});
  submitted = false;
  request: any = Object.create({});

  constructor(private _storage: StorageService,
    private toast: CustomToastService,
    private router: Router,
    private confirmationService: ConfirmationService,
    private readonly _userProcessApi: UserProcessApiService,
    private spinner: NgxSpinnerService) {
    this.process = this._storage.getObject(STORAGE_LOCAL, PROCESS_USER_SELECTED_ROUTE);
    this.evaluation = this._storage.getObject(STORAGE_LOCAL, PROCESS_USER_SELECTED_EVALUATION);
  }

  ngOnInit(): void {
   this.request = {
      codeEvaluation: this.evaluation.id,
      idMemberProcess: this.process.idUserProcess
    };
    this.spinner.show("load");
    this._userProcessApi.findEvaluation(this.request)
    .subscribe((resp: ResponseApi) => {
      this.evaluation = {
        ...this.evaluation,
        idMemberEvaluation: resp.result.id
      };
      this._storage.createObject(STORAGE_LOCAL, PROCESS_USER_SELECTED_EVALUATION, this.evaluation);
      this.submitted = true;
      this.spinner.hide("load");
    }, err => {
      console.log(err);
      this.spinner.hide("load");
      this.submitted = false;
      delete this.evaluation.idMemberEvaluation;
      this._storage.createObject(STORAGE_LOCAL, PROCESS_USER_SELECTED_EVALUATION, this.evaluation);
    });
  }
  onSubmit() {
    if (this.checked) {
      this.confirmationService.confirm({
        message: '¿Estás listo para iniciar con la evaluación?',
        header: 'Confirmar',
        icon: 'pi pi-check-circle',
        accept: () => {
          if (this.evaluation.idMemberEvaluation !== undefined && this.evaluation.idMemberEvaluation !== null) {
            this.router.navigate(['quiz']);
          } else {
            this.spinner.show("load");
            this._userProcessApi.createEvaluation(this.request).subscribe((resp: ResponseApi) => {
              this.spinner.hide("load");
              this.evaluation = {
                ...this.evaluation,
                idMemberEvaluation: resp.result.id
              };
              this._storage.createObject(STORAGE_LOCAL, PROCESS_USER_SELECTED_EVALUATION, this.evaluation);
              this.submitted = true;
              this.router.navigate(['quiz']);
            }, err => {
              console.log(err);
              this.spinner.hide("load");
            });
          }
        }
      });
    } else {
      this.toast.addPrimeToast('info', '', 'Debe aceptar los términos para empezar la evaluación.');
    }
  }

}
