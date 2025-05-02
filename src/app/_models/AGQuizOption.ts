export class Option {
    id: number;
    content: string;
    isValid: boolean;
    selected: boolean = false;
    orderAnswer: number;

    constructor(data: any) {
        data = data || {};
        this.id = data.id;
        this.content = data.content;
        this.isValid = data.isValid;
        this.orderAnswer = data.orderAnswer;
    }
}
