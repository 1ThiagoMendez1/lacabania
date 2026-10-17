/**
 * Historic reset endpoint disabled to prevent accidental data destruction.
 * A database reset must never be exposed as an unauthenticated HTTP request.
 * Existing database contents are not touched by this route.
 */
export async function GET() {
  return Response.json(
    { success: false, error: 'El reinicio remoto de datos está deshabilitado por seguridad.' },
    { status: 410, headers: { 'Cache-Control': 'no-store' } },
  );
}
