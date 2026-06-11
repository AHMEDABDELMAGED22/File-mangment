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

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
  const targetEmail = process.argv[2] || 'testadmin@example.com';
  console.log(`Searching for user with email or name: ${targetEmail}`);

  // Fetch profiles
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*');

  if (error) {
    console.error("Error fetching profiles:", error);
    return;
  }

  // Find profile by email (if available) or full_name
  // Wait, let's see. The profiles table doesn't have an email column in the schema? 
  // Let's check the schema by listing profile fields.
  // We can query auth.users using the admin auth client!
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error("Error listing auth users:", authError);
    return;
  }

  const user = users.find(u => u.email === targetEmail);
  if (!user) {
    console.error(`User with email ${targetEmail} not found in auth.users.`);
    console.log("Existing auth users emails:", users.map(u => u.email).filter(Boolean));
    return;
  }

  console.log(`Found auth user: ${user.email}, ID: ${user.id}`);

  const { data, error: updateError } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', user.id)
    .select();

  if (updateError) {
    console.error("Error updating role:", updateError);
  } else {
    console.log("Successfully updated user role to admin!", data);
  }
}

main();
