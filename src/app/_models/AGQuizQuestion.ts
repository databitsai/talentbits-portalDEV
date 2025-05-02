import { Option } from './AGQuizOption';

export class Question {
    id: number;
    title: string;
    content: string;
    typeQuestion: number;
    answers: Option[];
    answered!: boolean;
    version: number;
    code: string;

    constructor(data: any) {
        data = data || {};
        this.id = data.id;
        this.title = data.title;
        this.content = data.content;
        this.typeQuestion = data.typeQuestion;
        this.answers = [];
        data.answers.forEach((o: any) => {
            this.answers.push(new Option(o));
        });
        this.version = data.version;
        this.code = data.code;
    }
}
