export class ErrorApp extends Error {
  constructor(
    public estado: number,
    mensaje: string,
    public codigo: string,
  ) {
    super(mensaje);
    this.name = 'ErrorApp';
  }
}

export function traducirDuplicado(error: unknown): never {
  const duplicado = error as { code?: string; message?: string };
  if (duplicado.code === 'ER_DUP_ENTRY') {
    const texto = duplicado.message || '';
    if (texto.includes('identificacion')) {
      throw new ErrorApp(409, 'La identificación ya está registrada.', 'IDENTIFICACION_DUPLICADA');
    }
    if (texto.includes('correo')) {
      throw new ErrorApp(409, 'El correo ya está registrado.', 'CORREO_DUPLICADO');
    }
    if (texto.includes('numero')) {
      throw new ErrorApp(409, 'El número de cuenta ya existe.', 'CUENTA_DUPLICADA');
    }
    throw new ErrorApp(409, 'El registro entra en conflicto con uno existente.', 'DUPLICADO');
  }
  throw error;
}
