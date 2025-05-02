import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ReportTeamService {

  canvasParticipants: any;
  canvasAvgScore: any;
  canvasAvgTime: any;
  canvasScoreTime: any;
  constructor() { }
}
