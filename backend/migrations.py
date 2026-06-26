from sqlalchemy import inspect, text


def run_sqlite_migrations(engine):
    inspector = inspect(engine)
    tables = inspector.get_table_names()

    if "sessoes_estudo" in tables:
        columns = {column["name"] for column in inspector.get_columns("sessoes_estudo")}
        if "tipo" not in columns:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE sessoes_estudo ADD COLUMN tipo VARCHAR(20) DEFAULT 'estudo'"))

    if "plano_semanal" in tables:
        columns = {column["name"] for column in inspector.get_columns("plano_semanal")}
        if "materia_id" not in columns:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE plano_semanal ADD COLUMN materia_id INTEGER"))
                conn.execute(text("""
                    UPDATE plano_semanal
                    SET materia_id = (
                        SELECT materia_id FROM assuntos WHERE assuntos.id = plano_semanal.assunto_id
                    )
                    WHERE materia_id IS NULL
                """))
        with engine.begin() as conn:
            info = conn.execute(text("PRAGMA table_info(plano_semanal)")).mappings().all()
            assunto_col = next((column for column in info if column["name"] == "assunto_id"), None)
            if assunto_col and assunto_col["notnull"]:
                conn.execute(text("PRAGMA foreign_keys=off"))
                conn.execute(text("""
                    CREATE TABLE plano_semanal_new (
                        id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                        dia_semana INTEGER NOT NULL,
                        materia_id INTEGER,
                        assunto_id INTEGER,
                        tempo_minutos INTEGER,
                        tipo VARCHAR(20),
                        FOREIGN KEY(materia_id) REFERENCES materias (id) ON DELETE CASCADE,
                        FOREIGN KEY(assunto_id) REFERENCES assuntos (id) ON DELETE CASCADE
                    )
                """))
                conn.execute(text("""
                    INSERT INTO plano_semanal_new (id, dia_semana, materia_id, assunto_id, tempo_minutos, tipo)
                    SELECT id, dia_semana, materia_id, assunto_id, tempo_minutos, tipo
                    FROM plano_semanal
                """))
                conn.execute(text("DROP TABLE plano_semanal"))
                conn.execute(text("ALTER TABLE plano_semanal_new RENAME TO plano_semanal"))
                conn.execute(text("PRAGMA foreign_keys=on"))

    if "revisoes" not in tables:
        with engine.begin() as conn:
            conn.execute(text("""
                CREATE TABLE revisoes (
                    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                    topico_id INTEGER NOT NULL,
                    sessao_origem_id INTEGER,
                    sessao_realizada_id INTEGER,
                    data_prevista DATETIME NOT NULL,
                    status VARCHAR(20) DEFAULT 'pendente',
                    etapa VARCHAR(30),
                    motivo VARCHAR(200),
                    percentual_liquido_origem FLOAT DEFAULT 0,
                    created_at DATETIME,
                    completed_at DATETIME,
                    FOREIGN KEY(topico_id) REFERENCES topicos (id) ON DELETE CASCADE,
                    FOREIGN KEY(sessao_origem_id) REFERENCES sessoes_estudo (id) ON DELETE SET NULL,
                    FOREIGN KEY(sessao_realizada_id) REFERENCES sessoes_estudo (id) ON DELETE SET NULL
                )
            """))
