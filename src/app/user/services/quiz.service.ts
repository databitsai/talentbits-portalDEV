import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class QuizService {

  constructor(private http: HttpClient) { }

  get(url: string) {
    return of(mockup);
  }

  getAll() {
    return [
      { id: 'data/javascript.json', name: 'JavaScript' },
      { id: 'data/aspnet.json', name: 'Asp.Net' },
      { id: 'data/csharp.json', name: 'C Sharp' },
      { id: 'data/designPatterns.json', name: 'Design Patterns' }
    ];
  }
}
const mockup = {
  "id": 1,
  "name": "JavaScript Quiz",
  "description": "JavaScript Quiz (Basic Multiple Choice Questions for JavaScript Developers)",
  "questions": [
      {
          "id": 1010,
          'title': "Title 1",
          "content": "Which HTML tag do we use to put the JavaScript?",
          "typeQuestion": 1201,
          "answers": [
              {
                  "id": 1055,
                  "content": "<javascript>",
                  "isValid": false
              },
              {
                  "id": 1056,
                  "content": "<script>",
                  "isValid": true
              },
              {
                  "id": 1057,
                  "content": "<js>",
                  "isValid": false
              },
              {
                  "id": 1058,
                  "content": "None of the above",
                  "isValid": false
              }
          ]
      },
      {
          "id": 1011,
          'title': "Title 2",
          "content": "Which built-in method calls a function for each element in the array?",
          "typeQuestion": 1201,
          "answers": [
              {
                  "id": 1055,
                  "content": "while()",
                  "isValid": false
              },
              {
                  "id": 1057,
                  "content": "loop",
                  "isValid": false
              },
              {
                  "id": 1056,
                  "content": "forEach",
                  "isValid": true
              },
              {
                  "id": 1058,
                  "content": "takeUntil",
                  "isValid": false
              }
          ]
      },
      {
          "id": 1012,
          'title': "Title 3",
          "content": "What is the difference between let and var?",
          "typeQuestion": 1201,
          "answers": [
              {
                  "id": 1055,
                  "content": "let has local scope",
                  "isValid": true
              },
              {
                  "id": 1057,
                  "content": "Both are same",
                  "isValid": false
              },
              {
                  "id": 1056,
                  "content": "var is new data type",
                  "isValid": false
              },
              {
                  "id": 1058,
                  "content": "let consumes more cpu and ram",
                  "isValid": false
              }
          ]
      },
      {
          "id": 1013,
          'title': "Title 4",
          "content": "What is TypeScript?",
          "typeQuestion": 1201,
          "answers": [
              {
                  "id": 1055,
                  "content": "A Language based on Javascript",
                  "isValid": true
              },
              {
                  "id": 1057,
                  "content": "script that runs on browser",
                  "isValid": false
              },
              {
                  "id": 1056,
                  "content": "A DataType Collection of Javascript",
                  "isValid": false
              },
              {
                  "id": 1058,
                  "content": "None of the above",
                  "isValid": false
              }
          ]
      },
      {
          "id": 1014,
          'title': "Title 5",
          "content": "Which of the following is right syntex for arrow function?",
          "typeQuestion": 1201,
          "answers": [
              {
                  "id": 1055,
                  "content": "a -> { return b; }",
                  "isValid": false
              },
              {
                  "id": 1057,
                  "content": "x <= x + y;",
                  "isValid": false
              },
              {
                  "id": 1056,
                  "content": "x <- x + 5;",
                  "isValid": false
              },
              {
                  "id": 1058,
                  "content": "x => x + 5;",
                  "isValid": true
              }
          ]
      },
      {
          "id": 1015,
          'title': "Title 6",
          "content": "Which new ES6 syntax helps with formatting output text - mixing variables with string literals, for example.",
          "typeQuestion": 1201,
          "answers": [
              {
                  "id": 1055,
                  "content": "Generator Functions",
                  "isValid": false
              },
              {
                  "id": 1057,
                  "content": "Arrow Functions",
                  "isValid": false
              },
              {
                  "id": 1056,
                  "content": "Template Strings",
                  "isValid": true
              },
              {
                  "id": 1058,
                  "content": "Set Data Structure",
                  "isValid": false
              }
          ]
      },
      {
          "id": 1016,
          'title': "Title 7",
          "content": "Which ES6 feature helps in merging of a number of changed properties into an existing object?",
          "typeQuestion": 1201,
          "answers": [
              {
                  "id": 1055,
                  "content": "Class syntex",
                  "isValid": false
              },
              {
                  "id": 1056,
                  "content": "Object.assign()",
                  "isValid": true
              },
              {
                  "id": 1057,
                  "content": "map data structure",
                  "isValid": false
              },
              {
                  "id": 1058,
                  "content": "Array.includes(obj);",
                  "isValid": false
              }
          ]
      },
      {
          "id": 1017,
          'title': "Title 8",
          "content": "What is the difference between == and === ?",
          "typeQuestion": 1201,
          "answers": [
              {
                  "id": 1055,
                  "content": "=== throws syntex error",
                  "isValid": false
              },
              {
                  "id": 1056,
                  "content": "== checks values only, === checks types as well",
                  "isValid": true
              },
              {
                  "id": 1057,
                  "content": "=== is reference type check only",
                  "isValid": false
              },
              {
                  "id": 1058,
                  "content": "Both are same",
                  "isValid": false
              }
          ]
      },
      {
          "id": 1018,
          'title': "Title 9",
          "content": "Which of the following is NOT the method of an Array?",
          "typeQuestion": 1201,
          "answers": [
              {
                  "id": 1055,
                  "content": ".map()",
                  "isValid": false
              },
              {
                  "id": 1057,
                  "content": ".includes()",
                  "isValid": false
              },
              {
                  "id": 1056,
                  "content": ".subscribe()",
                  "isValid": true
              },
              {
                  "id": 1058,
                  "content": ".flatMap()",
                  "isValid": false
              }
          ]
      },
      {
          "id": 1019,
          'title': "Title 10",
          "content": "What will be the output of the following code: ['a', 'b', 'c'].fill(7, 1, 2);?",
          "typeQuestion": 1201,
          "answers": [
              {
                  "id": 1055,
                  "content": "['a', 7, 'c']",
                  "isValid": true
              },
              {
                  "id": 1056,
                  "content": "['a', 7, 7, 'b', 'c']",
                  "isValid": false
              },
              {
                  "id": 1057,
                  "content": "['a', 'b', 'c']",
                  "isValid": false
              },
              {
                  "id": 1058,
                  "content": "['7', 7, 'c']",
                  "isValid": false
              }
          ]
      }
  ]
};
