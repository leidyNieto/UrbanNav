import {injectable, /* inject, */ BindingScope} from '@loopback/core';
import { repository } from '@loopback/repository';
import { RolMenuRepository } from '../repositories';
import { HttpErrors } from '@loopback/rest';
import { UserProfile } from '@loopback/security';

@injectable({scope: BindingScope.TRANSIENT})
export class AuthService {
  constructor(
      @repository(RolMenuRepository)
      private rolMenuRepository : RolMenuRepository,
    ) {}

  /**Se crea la funcion de verificar aqui para poder ejecutar esta accion desde un servicio */
   async VerificarPermisoDeUsuarioPorRol(idRol: string, idMenu: string, accion: string): Promise<UserProfile | undefined>{
    let permiso = await this.rolMenuRepository.findOne({
      where:{
        rolId:idRol,
        menuId:idMenu,
      }
    });
    let continuar : boolean = false;
    if(permiso){
      switch(accion){
         case "guardar":
          continuar = permiso.guardar;
          break;
        case "editar":
          continuar = permiso.editar;
          break;
        case "listar":
          continuar = permiso.listar;
          break;
        case "eliminar":
          continuar = permiso.eliminar;
          break;
        case "descargar":
          continuar = permiso.descargar;
            break;
        default:
          throw new HttpErrors[401]("no es posible ejecutar la acción porque no existe")
      };
      if(continuar){
         let perfil: UserProfile = Object.assign({
          permitido : "OK"
         });
         return perfil;
      }else{
        return undefined;
      }
      }
    else{
      throw new HttpErrors[401]("No es posible ejecutar esta accion porque no tiene permisos")};
   }
}
