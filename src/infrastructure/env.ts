// infraestructura — acceso a variables de entorno de forma tipada y segura
export const PUBLIC_SHEETS_URL: string | undefined = import.meta.env.PUBLIC_SHEETS_URL;

/** Devuelve el URL del Web App o lanza error claro si falta (fail visible). */
export function getSheetsUrl(): string {
  if (!PUBLIC_SHEETS_URL) {
    throw new Error(
      'Falta PUBLIC_SHEETS_URL. Copia .env.example a .env y pega la URL del Web App de Apps Script.'
    );
  }
  return PUBLIC_SHEETS_URL;
}
