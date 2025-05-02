import { Company } from "./Company";

export class Account {
    id!: number;
    type!: number;
    description!: string;
    company!: Company;
    createdAt: any;
    updatedAt: any;
    enabled!: boolean;
}

export class AccountResume {
    id!: number;
    account!: string;
    type!: string;
    owner!: string;
    ownerEmail!: string;
    createdAt: any;
    updatedAt: any;
    idMembership!: number;
    subrole!: string;
}