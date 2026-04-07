-- 1. Crear las secuencias para los IDs correlativos
CREATE SEQUENCE IF NOT EXISTS user_cliente_seq START 1;
CREATE SEQUENCE IF NOT EXISTS user_colaborador_seq START 1;

-- 2. Función para generar el customId atómicamente
CREATE OR REPLACE FUNCTION generate_user_custom_id() 
RETURNS TRIGGER AS $$
DECLARE
    seq_val BIGINT;
    prefix TEXT;
BEGIN
    -- Solo generar si el customId no ha sido proporcionado manualmente
    IF NEW."customId" IS NULL OR NEW."customId" = '' THEN
        -- Determinar prefijo y secuencia basada en el IdentityType
        IF NEW."type" = 'CLIENTE' THEN
            prefix := 'CLI-';
            seq_val := nextval('user_cliente_seq');
        ELSE
            prefix := 'CO-';
            seq_val := nextval('user_colaborador_seq');
        END IF;

        -- Formatear a 4 dígitos (ej: CLI-0001)
        NEW."customId" := prefix || LPAD(seq_val::text, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Crear el Trigger que se activa ANTES de insertar un nuevo usuario
DROP TRIGGER IF EXISTS trg_generate_user_custom_id ON "User";
CREATE TRIGGER trg_generate_user_custom_id
BEFORE INSERT ON "User"
FOR EACH ROW
EXECUTE FUNCTION generate_user_custom_id();
