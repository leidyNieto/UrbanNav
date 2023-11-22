import {injectable, /* inject, */ BindingScope} from '@loopback/core';
import fetch from 'node-fetch';

@injectable({scope: BindingScope.TRANSIENT})
export class PqrsService {
  constructor(/* Add @inject to inject parameters */) {}

  /*
   * Add service methods here
   */

  async EnviarPQRS(datos: any, url: string) {
    try {
      const response = await fetch(url, {
        method: 'post',
        body: JSON.stringify(datos),
        headers: {'Content-Type': 'application/json'},
      });

      if (!response.ok) {
        console.error(`Error: ${response.status}`);
        return;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Fetch error: ${error}`);
    }
  }
}
