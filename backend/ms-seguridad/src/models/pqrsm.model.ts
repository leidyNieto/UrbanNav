import {Model, model, property} from '@loopback/repository';

@model({settings: {strict: false}})
export class Pqrsm extends Model {
  @property({
    type: 'string',
    required: true,
  })
  mensaje: string;

  @property({
    type: 'string',
    required: true,
  })
  tipo: string;

  // [prop: string]: any;

  constructor(data?: Partial<Pqrsm>) {
    super(data);
  }
}

export interface PqrsmRelations {
  // describe navigational properties here
}

export type PqrsmWithRelations = Pqrsm & PqrsmRelations;
