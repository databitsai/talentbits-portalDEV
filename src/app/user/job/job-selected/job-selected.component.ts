import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { ConfirmationService } from 'primeng/api';
import { ResponseApi } from 'src/app/_models/ResponseApi';
import { TokenClaims } from 'src/app/_models/TokenClaims';
import { Vaccant } from 'src/app/_models/Vaccant';
import { UserApiService } from 'src/app/_services/api/user-api.service';
import { VaccantApiService } from 'src/app/_services/api/vaccant-api.service';
import { CustomToastService } from 'src/app/_services/common/custom-toast.service';
import { AuthenticationService } from 'src/app/_services/security/authentication.service';
import { StorageService } from 'src/app/_services/security/storage.service';
import { STORAGE_SESSION, VACANT_SELECTED_USER } from 'src/app/_utils/constants';

@Component({
  selector: 'app-job-selected',
  templateUrl: './job-selected.component.html',
  styleUrls: ['./job-selected.component.scss']
})
export class JobSelectedComponent implements OnInit, OnDestroy {

  item!: any;
  vaccant!: Vaccant;
  tokenClaims!: TokenClaims;

  constructor(private _storage: StorageService,
    private _vaccantApi: VaccantApiService,
    private confirmationService: ConfirmationService,
    private spinner: NgxSpinnerService,
    private readonly _authApi: AuthenticationService,
    private toast: CustomToastService,
    private readonly _userAppApi: UserApiService) {
    this.tokenClaims = this._authApi.parseJwt(this._authApi.getTokenStored());
  }
  ngOnDestroy(): void {
    this._storage.deleteKey(STORAGE_SESSION, VACANT_SELECTED_USER);
  }

  ngOnInit(): void {
    this.item = this._storage.getObject(STORAGE_SESSION, VACANT_SELECTED_USER);
    if (this.item !== null) {
      this.spinner.show("load");
      this._vaccantApi.findByIdVaccant(this.item.id).subscribe((response: ResponseApi) => {
        this.vaccant = response.result;
        this.spinner.hide("load");
      }, err => {
        this.spinner.hide("load");
      });
    }
  }
  onApply() {
    this.spinner.show("load");
    this._userAppApi.readCvFilename(this.tokenClaims.memberid).subscribe((resp: ResponseApi) => {
      this.spinner.hide("load");
      this.confirmationService.confirm({
        message: '¿Quiere aplicar a esta vacante?',
        header: 'Aplicar con mi perfil',
        icon: 'pi pi-check-circle',
        accept: () => {
          const request: any = {
            idMembership: this.tokenClaims.memberid,
            idVaccant: this.vaccant.id
          };
          this.spinner.show("load");
          this._vaccantApi.createRequestMembership(request).subscribe((resp: ResponseApi) => {;
            this.spinner.hide("load");
            this.toast.addPrimeToast('success', '', resp.message);
          }, err => {
            console.log(err);
            this.spinner.hide("load");
            this.toast.addPrimeToast('info', '', err.error.message);
          });
        }
      });
    }, err => {
      console.log(err.error.message);
      this.spinner.hide("load");
      this.toast.addPrimeToast('info', 'Hoja de vida no encontrada', 'Debe cargar su hoja de vida en "Mi perfil" para poder postular');
    });
  }

}
