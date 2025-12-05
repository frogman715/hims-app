const bcrypt = require('bcryptjs');

async function generateHashes() {
  const passwords = {
    'rinaldy@hanmarine.co': 'director2025',
    'arief@hanmarine.co': 'admin2025',
    'dino@hanmarine.co': 'accounting2025',
    'cdmo@hanmarine.co': 'cdmo123',
    'operational@hanmarine.co': 'operational123',
    'hr@hanmarine.co': 'hr123'
  };
  
  console.log('-- SQL UPDATE statements with hashed passwords:\n');
  
  for (const [email, password] of Object.entries(passwords)) {
    const hash = await bcrypt.hash(password, 10);
    console.log(`UPDATE "User" SET password = '${hash}' WHERE email = '${email}';`);
  }
  
  console.log('\n-- Verify:');
  console.log('SELECT email, role FROM "User" ORDER BY email;');
}

generateHashes();
