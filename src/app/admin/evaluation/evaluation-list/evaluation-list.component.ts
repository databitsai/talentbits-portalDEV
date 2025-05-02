import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatStepper } from '@angular/material/stepper';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ConfirmationService } from 'primeng/api';
import { iif, Observable, of, throwError, zip } from 'rxjs';
import { mergeMap, tap } from 'rxjs/operators';
import { Catalog } from 'src/app/_models/Catalog';
import { Evaluation } from 'src/app/_models/Evaluation';
import { Profile } from 'src/app/_models/Profile';
import { ResponseApi } from 'src/app/_models/ResponseApi';
import { UserAccount } from 'src/app/_models/UserAccount';
import { CatalogApiService } from 'src/app/_services/api/catalog-api.service';
import { EvaluationApiService } from 'src/app/_services/api/evaluation-api.service';
import { ProfileApiService } from 'src/app/_services/api/profile-api.service';
import { CustomToastService } from 'src/app/_services/common/custom-toast.service';
import {
  CATALOG_EVALUATIONS,
  CATALOG_EVALUATION_TYPES
} from 'src/app/_utils/constants';

@Component({
  selector: 'app-evaluation-list',
  templateUrl: './evaluation-list.component.html',
})
export class EvaluationListComponent implements OnInit, OnDestroy {
  // table
  itemDialog!: boolean;
  items: Evaluation[] = [];
  item!: Evaluation;
  selectedItems: Evaluation[] = [];
  submitted: boolean = false;

  profileItems: Profile[] = [];
  profileItem!: Profile;

  // catalogs
  evaluationsAvailables: Catalog[] = [];
  evaluationsTypes: Catalog[] = [];

  // forms
  checkEvaluationForm!: FormGroup;

  // variables
  cities!: Profile[];
  selectedCity!: string;

  constructor(
    private fb: FormBuilder,
    private toast: CustomToastService,
    private confirmationService: ConfirmationService,
    private readonly _catalogEvaluation: EvaluationApiService,
    private readonly _catalogProfile: ProfileApiService,
    private readonly _catalogApi: CatalogApiService,
    private _evaluationApi: EvaluationApiService,
    private spinner: NgxSpinnerService,
    private router: Router,
    
  ) {}

  ngOnInit(): void {
    this.checkEvaluationForm = this.fb.group({
      id: [],
      name: ['', Validators.required],
      description: ['', Validators.required],
      type: ['', Validators.required],
      minScorePercent: ['', Validators.required],
      idProfiles: ['', Validators.required]
    });

    this.loadCatalogs()
      .pipe(
        tap((catalogs: any[]) => {
           this.evaluationsAvailables = catalogs[0];
           this.profileItems = catalogs[1];
           this.evaluationsTypes = catalogs[2];
        }),
        mergeMap((resp: any[]) =>
          this._catalogEvaluation.findAllEvaluation()
            .pipe(
              mergeMap((response: ResponseApi) =>
                iif(() => response.status === 'OK',
                  of(response.result),
                  throwError(response.message)
                )
              )
            )
        )
      )
      .subscribe(
        (list: Evaluation[]) => {
          this.items = list;
        },
        (err) => {
          this.toast.addPrimeToast('error', '', err.error.message);
        }
      );
  }

  loadCatalogs(): Observable<any> {
    const getEvaluations$ = this._catalogApi.findAllByType(CATALOG_EVALUATIONS).pipe(
      mergeMap((response: ResponseApi) => iif(() => response.status === 'OK', of(response.result), throwError(response.message)))
    );
    const getProfiles$ = this._catalogProfile.findAllProfile().pipe(
      mergeMap((response: ResponseApi) => iif(() => response.status === 'OK', of(response.result), throwError(response.message)))
    );
    const getEvaluationsTypes$ = this._catalogApi.findAllByType(CATALOG_EVALUATION_TYPES).pipe(
      mergeMap((response: ResponseApi) => iif(() => response.status === 'OK', of(response.result), throwError(response.message)))
    );
    return zip(getEvaluations$, getProfiles$, getEvaluationsTypes$);
  }

  // Table CRUD
  saveItem() {
    if (this.checkEvaluationForm.valid) {
      this.saveItemOnDb(this.checkEvaluationForm.value, this.submitted);
    } else {
      this.validateAllFormFields(this.checkEvaluationForm);
    }
  }

  saveItemOnDb(item: any, submitted: boolean) {
    const save$ = this._evaluationApi.create(item);
    const update$ = this._evaluationApi.update(item);
    const request$ = !submitted ? save$ : update$;

    request$.subscribe(
      (resp: ResponseApi) => {
        this.item = resp.result;
        this.hideDialog();
        if (!submitted) {
          this.items.push(this.item);
        } else {
          this.items[this.findIndexById(this.item.id)] = this.item;
        }
        this.items = [...this.items];
        this.item = Object.create({});
        this.toast.addPrimeToast('success', '', resp.message);
      },
      (err) => {
        this.toast.addPrimeToast('error', '', err.error.message);
      },
      () => {}
    );
  }

  editItem(item: Evaluation) {
    this.item = item;
    this.checkEvaluationForm.get('id')?.setValue(item.id);
    this.checkEvaluationForm.get('name')?.setValue(item.name);
    this.checkEvaluationForm.get('type')?.setValue(item.type);
    this.checkEvaluationForm.get('description')?.setValue(item.description);
    this.checkEvaluationForm.get('minScorePercent')?.setValue(item.minScorePercent);
    this.checkEvaluationForm.get('enabled')?.setValue(item.enabled);
    this.checkEvaluationForm.get('idProfiles')?.setValue(item.profiles.map((i) => i.id));

    this.submitted = true;
    this.itemDialog = true;
  }

  deleteItem(item: UserAccount) {
    this.confirmationService.confirm({
      message: '¿Estás seguro de que quieres borrar ' + item.name + '?',
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.spinner.show('load');
        this._evaluationApi
          .delete(item.id)
          .pipe(
            mergeMap((response: ResponseApi) =>
              iif(
                () => response.status === 'OK',
                of(response),
                throwError(response.message)
              )
            )
          )
          .subscribe(
            (resp: any) => {
              this.items = this.items.filter((val) => val.id !== item.id);
              this.item = Object.create({});
              this.toast.addPrimeToast('success', '', resp.message);
              this.spinner.hide('load');
            },
            (err) => {
              this.toast.addPrimeToast('error', '', err.error.message);
              this.spinner.hide('load');
            }
          );
      },
    });
  }

  // Screen controls
  openNewEvaluation() {
    this.item = Object.create({});
    this.submitted = false;
    this.itemDialog = true;
  }

  hideDialog() {
    this.itemDialog = false;
    this.submitted = false;
    this.resetAllForms();
  }

  onHideCreate(event: any) {
    this.itemDialog = false;
    this.submitted = false;
    this.resetAllForms();
  }

  resetAllForms() {
    this.checkEvaluationForm.reset();
  }

  findIndexById(id: number): number {
    let index = -1;
    for (let i = 0; i < this.items.length; i++) {
      if (this.items[i].id === id) {
        index = i;
        break;
      }
    }
    return index;
  }

  validateAllFormFields(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach((field) => {
      const control = formGroup.get(field);
      if (control instanceof FormControl) {
        control.markAsTouched({ onlySelf: true });
      } else if (control instanceof FormGroup) {
        this.validateAllFormFields(control);
      }
    });
  }

  openPage(pageUrl: string) {
    this.router.navigate([pageUrl]);
  }

  // For custom component
  goForward(stepper: MatStepper) {
    stepper.next();
  }

  // destroy
  ngOnDestroy(): void {}

  // Selectors
  onSelectAll(items: any) {
    console.log(items);
  }

  onItemSelectProfile(item: any) {
    console.log(item);
  }

  onSelectEvaluationType() {
    const code: number = this.checkEvaluationForm.get('id')?.value ?? null;
    const evaluationSelected: Catalog = this.evaluationsAvailables.find(i => i.code === code) ?? Object.create(null);
    if (evaluationSelected) {
      this.checkEvaluationForm.get('name')?.setValue(evaluationSelected.label);
    }
  }
}
