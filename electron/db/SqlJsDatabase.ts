import type { Database as SqlJsDB, QueryExecResult } from 'sql.js'
import { writeFileSync, mkdirSync } from 'fs'
import { dirname } from 'path'

export interface RunResult {
  lastInsertRowid: number
  changes: number
}

class PreparedStatement {
  constructor(
    private readonly sqlDb: SqlJsDB,
    private readonly sql: string,
    private readonly db: SqlJsDatabase,
  ) {}

  all(...params: unknown[]): Record<string, unknown>[] {
    const stmt = this.sqlDb.prepare(this.sql)
    try {
      if (params.length > 0) stmt.bind(params as number[] | string[])
      const rows: Record<string, unknown>[] = []
      while (stmt.step()) {
        rows.push(stmt.getAsObject() as Record<string, unknown>)
      }
      return rows
    } finally {
      stmt.free()
    }
  }

  get(...params: unknown[]): Record<string, unknown> | undefined {
    const stmt = this.sqlDb.prepare(this.sql)
    try {
      if (params.length > 0) stmt.bind(params as number[] | string[])
      if (stmt.step()) return stmt.getAsObject() as Record<string, unknown>
      return undefined
    } finally {
      stmt.free()
    }
  }

  run(...params: unknown[]): RunResult {
    this.sqlDb.run(this.sql, params as number[] | string[])
    const lastInsertRowid = this.scalar('SELECT last_insert_rowid()')
    const changes = this.scalar('SELECT changes()')
    if (!this.db._inTransaction) this.db.save()
    return { lastInsertRowid, changes }
  }

  private scalar(sql: string): number {
    const result = this.sqlDb.exec(sql) as QueryExecResult[]
    return (result[0]?.values[0]?.[0] as number) ?? 0
  }
}

export class SqlJsDatabase {
  _inTransaction = false

  constructor(private readonly sqlDb: SqlJsDB, private readonly dbPath: string) {}

  pragma(str: string): void {
    try { this.sqlDb.run(`PRAGMA ${str}`) } catch {}
  }

  exec(sql: string): this {
    this.sqlDb.exec(sql)
    return this
  }

  prepare(sql: string): PreparedStatement {
    return new PreparedStatement(this.sqlDb, sql, this)
  }

  transaction<T>(fn: (arg: T) => void): (arg: T) => void {
    return (arg: T) => {
      this._inTransaction = true
      this.sqlDb.run('BEGIN')
      try {
        fn(arg)
        this.sqlDb.run('COMMIT')
      } catch (e) {
        try { this.sqlDb.run('ROLLBACK') } catch {}
        throw e
      } finally {
        this._inTransaction = false
      }
      this.save()
    }
  }

  save(): void {
    const data = this.sqlDb.export()
    mkdirSync(dirname(this.dbPath), { recursive: true })
    writeFileSync(this.dbPath, Buffer.from(data))
  }
}
