//este codigo se encuentra en la pagina de loopback
//se coloca la liberia npm i @loopback/authentication y npm i @loopback/security
// se coloca la libreria npm i parse-bearer-token
import {AuthenticationBindings, AuthenticationMetadata, AuthenticationStrategy} from '@loopback/authentication'; 
import { inject, service } from '@loopback/core';
import {HttpErrors, Request} from '@loopback/rest';
import {UserProfile} from '@loopback/security';
import parseBearerToken from 'parse-bearer-token';
import {AuthService, SeguridadUsuarioService} from '../services';
import {RolMenuRepository} from '../repositories';
import { repository } from '@loopback/repository';

export class AuthStrategy implements AuthenticationStrategy {
    name: string = 'auth';
  
    constructor(
    @service(SeguridadUsuarioService)
    public servicioSeguridadUsuario: SeguridadUsuarioService,
    //inyector de un metadata
    @inject(AuthenticationBindings.METADATA)
    private metadata: AuthenticationMetadata[],
    @repository(RolMenuRepository)
    private rolMenuRepository : RolMenuRepository,
    @service(AuthService)
    private servicioAuth: AuthService,
    ) {}
  

    /**
     * autentificación de un usuario frente a una acción en la base de datos
     * @param request la solicitud con el token
     * @returns perfil de usuario o undefined cuando no ahi permiso 
     */
    async authenticate(request: Request): Promise<UserProfile | undefined> {
     let token = parseBearerToken(request);
     if(token){
      let idRol = this.servicioSeguridadUsuario.obtenerRolDesdeToken(token);
      let idMenu:string = this.metadata[0].options![0];
      let accion:string = this.metadata[0].options![1];
      console.log(this.metadata);
      /**Se manda la funcion anterior al auth service y ahora lo consumimos de esta forma aqui, importamos 
       * el auth service y lo inyectamos en el constructor y llamamos la funcion desde el servicio.
      */
      try{
        let res = await this.servicioAuth.VerificarPermisoDeUsuarioPorRol(idRol, idMenu, accion);
        return res;
      }catch(e){
        throw e;
      }
     }
     throw new HttpErrors[401]("no se puede ejecutar la acción por falta de un token.");
    }
  }