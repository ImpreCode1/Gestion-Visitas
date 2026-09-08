/**
 * @fileoverview Helper para resolver la identidad del usuario actual en las rutas API.
 *
 * La autenticación por JWT por sesión se ha deshabilitado en las rutas API
 * (PRY-19: despliegue en plattstest sin Hydra IAM; se elimina la validación de
 * token por petición). Para que las rutas que necesitan conocer al usuario sigan
 * funcionando, la identidad se obtiene de la cabecera opcional `X-User-Email`.
 * Si no se envía la cabecera, se usa como fallback el primer usuario activo
 * (no eliminado) de la base de datos, o `null` si no existe ninguno.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Resuelve el usuario actual a partir de la cabecera `X-User-Email` o de un
 * fallback con el primer usuario activo de la base de datos.
 *
 * @async
 * @param {Request} request - Objeto de la solicitud HTTP entrante.
 * @returns {Promise<object|null>} El usuario de la base de datos, o `null` si
 * no hay ningún usuario disponible.
 */
export async function resolverUsuario(request) {
  const emailHeader = request.headers.get("X-User-Email");

  if (emailHeader) {
    const usuario = await prisma.user.findFirst({
      where: { email: emailHeader, deletedAt: null },
    });
    if (usuario) return usuario;
  }

  return prisma.user.findFirst({ where: { deletedAt: null } });
}
