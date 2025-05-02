export class RequestApi {
    origin: string;
    request: any;
    constructor(origin: string, request: any) {
        this.origin = origin;
        this.request = request;
    }
}