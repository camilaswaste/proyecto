const bcrypt = require('bcryptjs');

async function generateAdmin() {
  const password = 'Admin123!';
  const hash = await bcrypt.hash(password, 10);
  
  console.log('===========================================');
  console.log('HASH GENERADO CORRECTAMENTE');
  console.log('===========================================');
  console.log('Contraseña:', password);
  console.log('Hash:', hash);
  console.log('===========================================');
  console.log('\nScript SQL:');
  console.log(`
DELETE FROM Usuarios;

INSERT INTO Usuarios (
    RolID,
    NombreUsuario,
    Email,
    PasswordHash,
    Nombre,
    Apellido,
    Telefono,
    Activo,
    RequiereCambioPassword
) VALUES (
    1,
    'admin',
    'admin@mundofitness.com',
    '${hash}',
    'Administrador',
    'Sistema',
    '912345678',
    1,
    0
);
  `);
}

generateAdmin();