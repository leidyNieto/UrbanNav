//se crea un servicio para asi hacer un codgo reutilizable y de poco mantenimiento
//se crea un  clase  servicio  para ejecutarse dentro de un conexto de aplicacion
//este aporta a las seguridad del usuario
import {injectable, /* inject, */ BindingScope} from '@loopback/core';
import { User } from '../models';
import { configuracionSeguridaad } from '../config/seguridad.config';

const  generator = require('generate-password');
const MD5 = require("crypto-js/md5");
const jwt = require('jsonwebtoken');
@injectable({scope: BindingScope.TRANSIENT})
export class SeguridadUsuarioService {
  constructor(/* Add @inject to inject parameters */) {}

  /*
   * crear una clave aleatoria 
   *@returns cadena aleatoria de 10 caracteres
   */
  crearClave():string{
    //genera nuevas contraseñas
    let clave = generator.generate({
      length: 10,
      numbers: true
    });
    return clave;
  }

   /**
   * cifrar una cadena con metodo md5
   * @param cadena de texto a cifrar
   * @returns cadena cifrada con md5
   */
  cifrarTexto(cadena:string):string{
    //cifra el texto
     let cadenaCifrado = MD5(cadena).toString();
     return cadenaCifrado;
  }
  /**
 * valida y obtiene el rol de un token
 * @param tk el token
 * @returns el _id del rol
 */
  obtenerRolDesdeToken(tk:string):string{
    let obj = jwt.verify(tk,configuracionSeguridaad.claveJWT);
    return obj.role;

}
  

}
