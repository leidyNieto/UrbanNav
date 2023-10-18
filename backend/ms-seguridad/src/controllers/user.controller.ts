import {authenticate} from '@loopback/authentication';
import {service} from '@loopback/core';
import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  HttpErrors,
  param,
  patch,
  post,
  put,
  requestBody,
  response,
} from '@loopback/rest';
import {UserProfile} from '@loopback/security';
import {ConfiguracionNotificaciones} from '../config/notificaciones.config';
import {configuracionSeguridaad} from '../config/seguridad.config';
import {Credenciales, CredencialesRecuperarClave, FactorDeAutenticacionPorCodigo, Login, PermisosRolMenu, User} from '../models';
import {LoginRepository, UserRepository} from '../repositories';
import {AuthService, NotificacionesService, SeguridadUsuarioService} from '../services';

export class UserController {
  //en el controlador se inyectan dependencias generadas por loopback
  constructor(
    //donde dice que se necesita un repositorio,este es de usuarioRepositori, dpnde definimos una variablede acceso publico,
    //esta para acceder a todas las acciones del crud dentro de la entidad usuario
    @repository(UserRepository)
    public userRepository: UserRepository,
    //se invoca el servicio de seguridad para que se pueda acceder a las funciones de este
    //en este caso el de crear clave,cifrar
    @service(SeguridadUsuarioService)
    public servicioSeguridad: SeguridadUsuarioService,
    @repository(LoginRepository)
    public loginrepository: LoginRepository,
    @service(AuthService)
    private servicioAuth: AuthService,
    @service(NotificacionesService)
    public servicioNotificaciones: NotificacionesService,
  ) { }

  @post('/user')
  @response(200, {
    description: 'User model instance',
    content: {'application/json': {schema: getModelSchemaRef(User)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(User, {
            title: 'NewUser',
            exclude: ['_id'],
          }),
        },
      },
    })
    user: Omit<User, '_id'>,
  ): Promise<User> {
    //crear la clave
    let clave = this.servicioSeguridad.crearTextoAleatorio(10);
    //cifrar la clave
    let claveCifrada = this.servicioSeguridad.cifrarTexto(clave);
    //asignar la clave cifrada al usuario
    user.clave = claveCifrada;
    return this.userRepository.create(user);
  }

  @get('/user/count')
  @response(200, {
    description: 'User model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(User) where?: Where<User>,
  ): Promise<Count> {
    return this.userRepository.count(where);
  }

  //este metodo va a estar protegido por el componente de autenticacion
  @authenticate({
    //esto lo hago por medio de un objeto
    //se envia el nombre de la estrategia de autenticacion
    strategy: "auth",
    //se envia una opciones,
    options: [configuracionSeguridaad.menuUsuarioId, configuracionSeguridaad.listarAccion]
  })
  @get('/user')
  @response(200, {
    description: 'Array of User model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(User, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(User) filter?: Filter<User>,
  ): Promise<User[]> {
    return this.userRepository.find(filter);
  }

  @patch('/user')
  @response(200, {
    description: 'User PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(User, {partial: true}),
        },
      },
    })
    user: User,
    @param.where(User) where?: Where<User>,
  ): Promise<Count> {
    return this.userRepository.updateAll(user, where);
  }

  @get('/user/{id}')
  @response(200, {
    description: 'User model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(User, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(User, {exclude: 'where'}) filter?: FilterExcludingWhere<User>
  ): Promise<User> {
    return this.userRepository.findById(id, filter);
  }

  @patch('/user/{id}')
  @response(204, {
    description: 'User PATCH success',
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(User, {partial: true}),
        },
      },
    })
    user: User,
  ): Promise<void> {
    await this.userRepository.updateById(id, user);
  }

  @put('/user/{id}')
  @response(204, {
    description: 'User PUT success',
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() user: User,
  ): Promise<void> {
    await this.userRepository.replaceById(id, user);
  }

  @del('/user/{id}')
  @response(204, {
    description: 'User DELETE success',
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.userRepository.deleteById(id);
  }

  /*
    Metodos personalizados para la API
  */

  @post('/identificar-usuario')
  @response(200, {
    description: 'Identificar un usuario por medio de su correo y clave',
    content: {'application/json': {schema: getModelSchemaRef(User)}},
  })
  async identificarUsuario(
    @requestBody(
      {
        content: {
          'application/json': {
            schema: getModelSchemaRef(Credenciales)
          }
        }
      }
    )
    credenciales: Credenciales
  ): Promise<object> {
    let user = await this.servicioSeguridad.identificarUsuario(credenciales);
    if (user) {
      let codigo2fa = this.servicioSeguridad.crearTextoAleatorio(5);
      let login: Login = new Login();
      login.userId = user._id!;
      login.codigo2fa = codigo2fa;
      login.estadoCodigo2fa = false;
      login.token = "";
      login.estadoToken = false;
      this.loginrepository.create(login);
      //notificar al usuarrio por correo o sms
      let datos = {
        correoDestino: user.correo,
        mensaje: `Hola ${user.nombre} ${user.apellido}. Su código de segundo factor de autenticación es: ${codigo2fa}`,
      };
      let url = ConfiguracionNotificaciones.urlNotificaciones2fa;
      this.servicioNotificaciones.EnviarNotificacion(datos, url);
      user.clave = "";
      return user;
    }
    return new HttpErrors[401]("Las credenciales no son correctas");
  }

  @post('/recuperar-clave')
  @response(200, {
    description: 'Recuperar clave de un usuario por medio de un sms',
    content: {'application/json': {schema: getModelSchemaRef(User)}},
  })
  async RecuperarClaveUsuario(
    @requestBody(
      {
        content: {
          'application/json': {
            schema: getModelSchemaRef(CredencialesRecuperarClave)
          }
        }
      }
    )
    credenciales: CredencialesRecuperarClave
  ): Promise<object> {
    let user = await this.userRepository.findOne({
      where: {
        correo: credenciales.correo
      }
    });
    if (user) {
      let nuevaClave = this.servicioSeguridad.crearTextoAleatorio(5);
      console.log(nuevaClave);
      let claveCifrada = this.servicioSeguridad.cifrarTexto(nuevaClave);
      user.clave = claveCifrada;
      this.userRepository.updateById(user._id, user);
      //notificar al usuario por sms
      let datos = {
        numero_telefono: user.telefono,
        mensaje: `Hola ${user.nombre} ${user.apellido}. Su nueva clave es ${nuevaClave}`,
      };
      let url = ConfiguracionNotificaciones.urlNotificacionesSms;
      this.servicioNotificaciones.EnviarNotificacion(datos, url);
      user.clave = "";
      return user;
    }
    return new HttpErrors[401]("Las credenciales no son correctas");
  }

  @post('/validar-permisos')
  @response(200, {
    description: 'Validación de permisos de un usuario para logica de negocio',
    content: {'application/json': {schema: getModelSchemaRef(PermisosRolMenu)}},
  })
  async ValidarPermisosDeUsuario(
    @requestBody(
      {
        content: {
          'application/json': {
            schema: getModelSchemaRef(PermisosRolMenu)
          }
        }
      }
    )
    datos: PermisosRolMenu
  ): Promise<UserProfile | undefined> {
    let idRol = this.servicioSeguridad.obtenerRolDesdeToken(datos.token);
    return this.servicioAuth.VerificarPermisoDeUsuarioPorRol(idRol, datos.idMenu, datos.accion);
  }

  @post('/verificar-2fa')
  @response(200, {
    description: 'validar un codigo de 2fa',
  })
  async VerificarCodigo2fa(
    @requestBody(
      {
        content: {
          'application/json': {
            schema: getModelSchemaRef(FactorDeAutenticacionPorCodigo)
          }
        }
      }
    )
    credenciales: FactorDeAutenticacionPorCodigo
  ): Promise<object> {
    let user = await this.servicioSeguridad.validarCodigo2fa(credenciales);
    if (user) {
      let token = this.servicioSeguridad.crearToken(user);
      if (user) {
        user.clave = "";
        try {
          this.userRepository.logins(user._id).patch({
            estadoCodigo2fa: true,
            token: token
          },
            {
              estadoCodigo2fa: false
            });
        } catch {
          console.log("No se ha almacenado el cambio del estado del token en la base de datos")
        }
        return {
          user: user,
          token: token
        };
      }
    }
    return new HttpErrors[401]("Codifo 2fa no valido");
  }
}
