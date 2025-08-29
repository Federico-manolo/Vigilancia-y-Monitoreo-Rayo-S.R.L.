const { sequelize } = require('../config/db');

/**
 * Crea/actualiza políticas de Row Level Security (RLS) para las tablas clave.
 * Estrategia idempotente: DROP POLICY IF EXISTS + CREATE POLICY; ENABLE RLS siempre.
 */
async function ensureRlsPolicies() {
  // Gate: solo aplicar RLS cuando se solicite explícitamente
  if (process.env.APPLY_RLS !== '1') {
    return { applied: false, reason: 'skipped' };
  }

  const queries = [
    // Always enable RLS on target tables
    `ALTER TABLE servicio ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE servicio FORCE ROW LEVEL SECURITY;`,
    `ALTER TABLE puesto ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE puesto FORCE ROW LEVEL SECURITY;`,
    `ALTER TABLE planilla ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE planilla FORCE ROW LEVEL SECURITY;`,
    `ALTER TABLE dia_planilla ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE dia_planilla FORCE ROW LEVEL SECURITY;`,
    `ALTER TABLE dia_puesto_tipo ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE dia_puesto_tipo FORCE ROW LEVEL SECURITY;`,
    `ALTER TABLE turno ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE turno FORCE ROW LEVEL SECURITY;`,

    // Servicio policies
    `DROP POLICY IF EXISTS servicio_read_all ON servicio;`,
    `DROP POLICY IF EXISTS servicio_write_owner ON servicio;`,
    `DROP POLICY IF EXISTS servicio_insert_owner ON servicio;`,
    `DROP POLICY IF EXISTS servicio_update_owner ON servicio;`,
    `DROP POLICY IF EXISTS servicio_delete_owner ON servicio;`,
    `CREATE POLICY servicio_read_all ON servicio FOR SELECT USING (true);`,
    `CREATE POLICY servicio_insert_owner ON servicio
      FOR INSERT
      WITH CHECK (
        current_setting('app.role') IN ('admin','contabilidad') OR
        id_usuario = current_setting('app.user_id')::int
      );`,
    `CREATE POLICY servicio_update_owner ON servicio
      FOR UPDATE
      USING (
        current_setting('app.role') IN ('admin','contabilidad') OR
        id_usuario = current_setting('app.user_id')::int
      )
      WITH CHECK (
        current_setting('app.role') IN ('admin','contabilidad') OR
        id_usuario = current_setting('app.user_id')::int
      );`,
    `CREATE POLICY servicio_delete_owner ON servicio
      FOR DELETE
      USING (
        current_setting('app.role') IN ('admin','contabilidad') OR
        id_usuario = current_setting('app.user_id')::int
      );`,

    // Puesto policies
    `DROP POLICY IF EXISTS puesto_read_all ON puesto;`,
    `DROP POLICY IF EXISTS puesto_write_owner ON puesto;`,
    `DROP POLICY IF EXISTS puesto_insert_owner ON puesto;`,
    `DROP POLICY IF EXISTS puesto_update_owner ON puesto;`,
    `DROP POLICY IF EXISTS puesto_delete_owner ON puesto;`,
    `CREATE POLICY puesto_read_all ON puesto FOR SELECT USING (true);`,
    `CREATE POLICY puesto_insert_owner ON puesto
      FOR INSERT
      WITH CHECK (
        current_setting('app.role') IN ('admin','contabilidad') OR
        EXISTS (
          SELECT 1 FROM servicio s
          WHERE s.id_servicio = puesto.id_servicio
            AND s.id_usuario = current_setting('app.user_id')::int
        )
      );`,
    `CREATE POLICY puesto_update_owner ON puesto
      FOR UPDATE
      USING (
        current_setting('app.role') IN ('admin','contabilidad') OR
        EXISTS (
          SELECT 1 FROM servicio s
          WHERE s.id_servicio = puesto.id_servicio
            AND s.id_usuario = current_setting('app.user_id')::int
        )
      )
      WITH CHECK (
        current_setting('app.role') IN ('admin','contabilidad') OR
        EXISTS (
          SELECT 1 FROM servicio s
          WHERE s.id_servicio = puesto.id_servicio
            AND s.id_usuario = current_setting('app.user_id')::int
        )
      );`,
    `CREATE POLICY puesto_delete_owner ON puesto
      FOR DELETE
      USING (
        current_setting('app.role') IN ('admin','contabilidad') OR
        EXISTS (
          SELECT 1 FROM servicio s
          WHERE s.id_servicio = puesto.id_servicio
            AND s.id_usuario = current_setting('app.user_id')::int
        )
      );`,

    // Planilla policies
    `DROP POLICY IF EXISTS planilla_read_all ON planilla;`,
    `DROP POLICY IF EXISTS planilla_write_owner ON planilla;`,
    `DROP POLICY IF EXISTS planilla_insert_owner ON planilla;`,
    `DROP POLICY IF EXISTS planilla_update_owner ON planilla;`,
    `DROP POLICY IF EXISTS planilla_delete_owner ON planilla;`,
    `CREATE POLICY planilla_read_all ON planilla FOR SELECT USING (true);`,
    `CREATE POLICY planilla_insert_owner ON planilla
      FOR INSERT
      WITH CHECK (
        current_setting('app.role') IN ('admin','contabilidad') OR
        EXISTS (
          SELECT 1
          FROM puesto p
          JOIN servicio s ON s.id_servicio = p.id_servicio
          WHERE p.id_puesto = planilla.id_puesto
            AND s.id_usuario = current_setting('app.user_id')::int
        )
      );`,
    `CREATE POLICY planilla_update_owner ON planilla
      FOR UPDATE
      USING (
        current_setting('app.role') IN ('admin','contabilidad') OR
        EXISTS (
          SELECT 1
          FROM puesto p
          JOIN servicio s ON s.id_servicio = p.id_servicio
          WHERE p.id_puesto = planilla.id_puesto
            AND s.id_usuario = current_setting('app.user_id')::int
        )
      )
      WITH CHECK (
        current_setting('app.role') IN ('admin','contabilidad') OR
        EXISTS (
          SELECT 1
          FROM puesto p
          JOIN servicio s ON s.id_servicio = p.id_servicio
          WHERE p.id_puesto = planilla.id_puesto
            AND s.id_usuario = current_setting('app.user_id')::int
        )
      );`,
    `CREATE POLICY planilla_delete_owner ON planilla
      FOR DELETE
      USING (
        current_setting('app.role') IN ('admin','contabilidad') OR
        EXISTS (
          SELECT 1
          FROM puesto p
          JOIN servicio s ON s.id_servicio = p.id_servicio
          WHERE p.id_puesto = planilla.id_puesto
            AND s.id_usuario = current_setting('app.user_id')::int
        )
      );`,

    // Dia_Planilla policies
    `DROP POLICY IF EXISTS dia_planilla_read_all ON dia_planilla;`,
    `DROP POLICY IF EXISTS dia_planilla_write_owner ON dia_planilla;`,
    `DROP POLICY IF EXISTS dia_planilla_insert_owner ON dia_planilla;`,
    `DROP POLICY IF EXISTS dia_planilla_update_owner ON dia_planilla;`,
    `DROP POLICY IF EXISTS dia_planilla_delete_owner ON dia_planilla;`,
    `CREATE POLICY dia_planilla_read_all ON dia_planilla FOR SELECT USING (true);`,
    `CREATE POLICY dia_planilla_insert_owner ON dia_planilla
      FOR INSERT
      WITH CHECK (
        current_setting('app.role') IN ('admin','contabilidad') OR
        EXISTS (
          SELECT 1
          FROM planilla pl
          JOIN puesto p ON p.id_puesto = pl.id_puesto
          JOIN servicio s ON s.id_servicio = p.id_servicio
          WHERE pl.id_planilla = dia_planilla.id_planilla
            AND s.id_usuario = current_setting('app.user_id')::int
        )
      );`,
    `CREATE POLICY dia_planilla_update_owner ON dia_planilla
      FOR UPDATE
      USING (
        current_setting('app.role') IN ('admin','contabilidad') OR
        EXISTS (
          SELECT 1
          FROM planilla pl
          JOIN puesto p ON p.id_puesto = pl.id_puesto
          JOIN servicio s ON s.id_servicio = p.id_servicio
          WHERE pl.id_planilla = dia_planilla.id_planilla
            AND s.id_usuario = current_setting('app.user_id')::int
        )
      )
      WITH CHECK (
        current_setting('app.role') IN ('admin','contabilidad') OR
        EXISTS (
          SELECT 1
          FROM planilla pl
          JOIN puesto p ON p.id_puesto = pl.id_puesto
          JOIN servicio s ON s.id_servicio = p.id_servicio
          WHERE pl.id_planilla = dia_planilla.id_planilla
            AND s.id_usuario = current_setting('app.user_id')::int
        )
      );`,
    `CREATE POLICY dia_planilla_delete_owner ON dia_planilla
      FOR DELETE
      USING (
        current_setting('app.role') IN ('admin','contabilidad') OR
        EXISTS (
          SELECT 1
          FROM planilla pl
          JOIN puesto p ON p.id_puesto = pl.id_puesto
          JOIN servicio s ON s.id_servicio = p.id_servicio
          WHERE pl.id_planilla = dia_planilla.id_planilla
            AND s.id_usuario = current_setting('app.user_id')::int
        )
      );`,

    // Dia_Puesto_Tipo policies
    `DROP POLICY IF EXISTS dia_puesto_tipo_read_all ON dia_puesto_tipo;`,
    `DROP POLICY IF EXISTS dia_puesto_tipo_write_owner ON dia_puesto_tipo;`,
    `DROP POLICY IF EXISTS dia_puesto_tipo_insert_owner ON dia_puesto_tipo;`,
    `DROP POLICY IF EXISTS dia_puesto_tipo_update_owner ON dia_puesto_tipo;`,
    `DROP POLICY IF EXISTS dia_puesto_tipo_delete_owner ON dia_puesto_tipo;`,
    `CREATE POLICY dia_puesto_tipo_read_all ON dia_puesto_tipo FOR SELECT USING (true);`,
    `CREATE POLICY dia_puesto_tipo_insert_owner ON dia_puesto_tipo
      FOR INSERT
      WITH CHECK (
        current_setting('app.role') IN ('admin','contabilidad') OR
        EXISTS (
          SELECT 1
          FROM puesto p
          JOIN servicio s ON s.id_servicio = p.id_servicio
          WHERE p.id_puesto = dia_puesto_tipo.id_puesto
            AND s.id_usuario = current_setting('app.user_id')::int
        )
      );`,
    `CREATE POLICY dia_puesto_tipo_update_owner ON dia_puesto_tipo
      FOR UPDATE
      USING (
        current_setting('app.role') IN ('admin','contabilidad') OR
        EXISTS (
          SELECT 1
          FROM puesto p
          JOIN servicio s ON s.id_servicio = p.id_servicio
          WHERE p.id_puesto = dia_puesto_tipo.id_puesto
            AND s.id_usuario = current_setting('app.user_id')::int
        )
      )
      WITH CHECK (
        current_setting('app.role') IN ('admin','contabilidad') OR
        EXISTS (
          SELECT 1
          FROM puesto p
          JOIN servicio s ON s.id_servicio = p.id_servicio
          WHERE p.id_puesto = dia_puesto_tipo.id_puesto
            AND s.id_usuario = current_setting('app.user_id')::int
        )
      );`,
    `CREATE POLICY dia_puesto_tipo_delete_owner ON dia_puesto_tipo
      FOR DELETE
      USING (
        current_setting('app.role') IN ('admin','contabilidad') OR
        EXISTS (
          SELECT 1
          FROM puesto p
          JOIN servicio s ON s.id_servicio = p.id_servicio
          WHERE p.id_puesto = dia_puesto_tipo.id_puesto
            AND s.id_usuario = current_setting('app.user_id')::int
        )
      );`,

    // Turno policies
    `DROP POLICY IF EXISTS turno_read_all ON turno;`,
    `DROP POLICY IF EXISTS turno_write_owner ON turno;`,
    `DROP POLICY IF EXISTS turno_insert_owner ON turno;`,
    `DROP POLICY IF EXISTS turno_update_owner ON turno;`,
    `DROP POLICY IF EXISTS turno_delete_owner ON turno;`,
    `CREATE POLICY turno_read_all ON turno FOR SELECT USING (true);`,
    `CREATE POLICY turno_insert_owner ON turno
      FOR INSERT
      WITH CHECK (
        current_setting('app.role') IN ('admin','contabilidad') OR
        EXISTS (
          SELECT 1
          FROM dia_planilla dp
          JOIN planilla pl ON pl.id_planilla = dp.id_planilla
          JOIN puesto p ON p.id_puesto = pl.id_puesto
          JOIN servicio s ON s.id_servicio = p.id_servicio
          WHERE dp.id_dia_planilla = turno.id_dia_planilla
            AND s.id_usuario = current_setting('app.user_id')::int
        )
      );`,
    `CREATE POLICY turno_update_owner ON turno
      FOR UPDATE
      USING (
        current_setting('app.role') IN ('admin','contabilidad') OR
        EXISTS (
          SELECT 1
          FROM dia_planilla dp
          JOIN planilla pl ON pl.id_planilla = dp.id_planilla
          JOIN puesto p ON p.id_puesto = pl.id_puesto
          JOIN servicio s ON s.id_servicio = p.id_servicio
          WHERE dp.id_dia_planilla = turno.id_dia_planilla
            AND s.id_usuario = current_setting('app.user_id')::int
        )
      )
      WITH CHECK (
        current_setting('app.role') IN ('admin','contabilidad') OR
        EXISTS (
          SELECT 1
          FROM dia_planilla dp
          JOIN planilla pl ON pl.id_planilla = dp.id_planilla
          JOIN puesto p ON p.id_puesto = pl.id_puesto
          JOIN servicio s ON s.id_servicio = p.id_servicio
          WHERE dp.id_dia_planilla = turno.id_dia_planilla
            AND s.id_usuario = current_setting('app.user_id')::int
        )
      );`,
    `CREATE POLICY turno_delete_owner ON turno
      FOR DELETE
      USING (
        current_setting('app.role') IN ('admin','contabilidad') OR
        EXISTS (
          SELECT 1
          FROM dia_planilla dp
          JOIN planilla pl ON pl.id_planilla = dp.id_planilla
          JOIN puesto p ON p.id_puesto = pl.id_puesto
          JOIN servicio s ON s.id_servicio = p.id_servicio
          WHERE dp.id_dia_planilla = turno.id_dia_planilla
            AND s.id_usuario = current_setting('app.user_id')::int
        )
      );`,
  ];

  for (const q of queries) {
    // Run sequentially to avoid DDL deadlocks
    await sequelize.query(q);
  }

  console.log('🔐 RLS policies ensured on servicio, puesto, planilla, dia_planilla, dia_puesto_tipo, turno');
}

module.exports = { ensureRlsPolicies };


