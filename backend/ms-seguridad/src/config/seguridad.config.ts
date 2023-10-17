export namespace configuracionSeguridaad{
    //esta sera nuestra clave
    export const claveJWT = process.env.SECRET_PASSWORD_JWT;
    export const menuUsuarioId = "651b1081deb9531aa4a636ef";
    export const listarAccion = "listar";
    export const editarAccion = "editar";
    export const eliminarAccion = "eliminar";
    export const guardarAccion = "guardar";
    export const descargarAccion = "descargar";
    export const mongoDbConnectionString  = process.env.CONNECTION_STRING_MONGODB;
    
}