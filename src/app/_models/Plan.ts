export class Plan {
    id!: any;
    name!: string;
    isPostVacancyActive!: boolean;
    isHighlightVacancyActive!: boolean;
    licences!: number;
    isBenchmarkingActive!: boolean;
    priceMonth!: number;
    priceYear!: number;
    paymentType!: number;
    isTemplate!: boolean;
    isPaymentRecurrent!: boolean;
    isSupportCallActive!: boolean;
    candidatesPerMonth!: number;
    type!: number;
    parentTemplate!: number;
    createdAt!: any;
    updatedAt!: any;
    title!: string;
    constructor() {}
}