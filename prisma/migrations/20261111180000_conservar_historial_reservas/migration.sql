-- Conservar todas las reservas al impedir eliminar a su propietario.
-- La restricción también protege ante inserciones concurrentes de reservas.
BEGIN;

ALTER TABLE "reservas" DROP CONSTRAINT "reservas_usuario_id_fkey";

ALTER TABLE "reservas" ADD CONSTRAINT "reservas_usuario_id_fkey"
    FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

COMMIT;
