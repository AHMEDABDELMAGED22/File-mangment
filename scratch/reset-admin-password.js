const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }
    env[match[1]] = value;
  }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseServiceKey = env['SUPABASE_SERVICE_ROLE_KEY'];

const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
  const adminId = 'a6e1863c-554b-44a4-b524-884afb3accee';
  const newPassword = 'AdminPassword123!';

  console.log(`Resetting password for admin user ID: ${adminId}`);
  const { data, error } = await adminClient.auth.admin.updateUserById(adminId, {
    password: newPassword
  });

  if (error) {
    console.error("Error resetting password:", error);
  } else {
    console.log("Password successfully updated to AdminPassword123! for", data.user.email);
  }
}

main();
