// Configuración de conexión a SQL Server (AWS RDS)
import sql from "mssql"

const config: sql.config = {
  server: process.env.SQL_SERVER_HOST || "mundofitness.cxekoi0g4d4y.us-east-1.rds.amazonaws.com",
  database: process.env.SQL_SERVER_DATABASE || "MundoFitness",
  user: process.env.SQL_SERVER_USER || "admin",
  password: process.env.SQL_SERVER_PASSWORD || "admin666",
  options: {
    encrypt: true,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
}

let pool: sql.ConnectionPool | null = null

export async function getConnection() {
  try {
    if (!pool) {
      pool = await sql.connect(config)
      console.log("Conexión a SQL Server establecida")
    }
    return pool
  } catch (error) {
    console.error("Error conectando a SQL Server:", error)
    throw error
  }
}

export { sql }
