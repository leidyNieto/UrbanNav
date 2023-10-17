import { User } from './../models/user.model';
import { Credenciales } from './../models/credenciales.model';
//se crea un servicio para asi hacer un codgo reutilizable y de poco mantenimiento
//se crea un  clase  servicio  para ejecutarse dentro de un conexto de aplicacion
//este aporta a las seguridad del usuario
import {injectable, /* inject, */ BindingScope} from '@loopback/core';
//import { User } from '../models';
import { configuracionSeguridaad } from '../config/seguridad.config';
import { repository } from '@loopback/repository';
import { LoginRepository, UserRepository } from '../repositories';
import { FactorDeAutenticacionPorCodigo, Login } from '../models';

const  generator = require('generate-password');
const MD5 = require("crypto-js/md5");
const jwt = require('jsonwebtoken');
@injectable({scope: BindingScope.TRANSIENT})
export class SeguridadUsuarioService {
  constructor(
  @repository(UserRepository)
  public userRepository : UserRepository,
  @repository(LoginRepository)
  public loginRepository : LoginRepository
) {}

  

  /*
   * crear una clave aleatoria 
   *@returns cadena aleatoria de n caracteres
   */
  crearTextoAleatorio(n:number):string{
    //genera nuevas contraseñas
    let clave = generator.generate({
      length: n,
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

/**
 * se busca un usuario por sus credenciales de acceso
 * @param credenciales credenciales del usuario 
 * @returns user enconrado o null
 */

async identificarUsuario(credenciales:Credenciales): Promise<User | null>{
let User = await this.userRepository.findOne({
  where:{
    correo:credenciales.correo,
    clave:credenciales.clave
  }
});
return User as User;
}


/**
 * valida el codigo 2fa de un usuario
 * @param Credenciales2fa credenciales del usuario con el codigo 2fa
 * @returns el registro de login o null
 */
async validarCodigo2fa(Credenciales2fa: FactorDeAutenticacionPorCodigo): Promise<User | null>{
  let login = await this.loginRepository.findOne({
    where:{
      userId: Credenciales2fa.userId,
      codigo2fa: Credenciales2fa.codigo2fa,
      estadoCodigo2fa: false

    }
  });
  if(login){
    let User = await this.userRepository.findById(Credenciales2fa.userId);
    return User;
  }return null;
}

/**
 * Generacion de jwt
 * @param user informacion del usuario
 * @returns token
 */
crearToken(user: User):string{
  let datos = {
    name: `$(usuario.nombre) $(usuario.apellido)`,
    role: user.rolId,
    email: user.correo
  }
  let token = jwt.sign({foo: 'bar'}, configuracionSeguridaad.claveJWT);
  return token;
}
}
