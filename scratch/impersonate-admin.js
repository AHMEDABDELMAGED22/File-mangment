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
  const adminEmail = 'ahmedabdelmaged22@gmail.com';
  const targetEmail = 'testadmin@example.com';

  console.log(`Generating magic link for admin: ${adminEmail}`);
  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type: 'magiclink',
    email: adminEmail,
    options: {
      redirectTo: 'http://localhost:3000'
    }
  });

  if (linkError) {
    console.error("Error generating link:", linkError);
    return;
  }

  const properties = linkData.properties;
  const hashedToken = properties.hashed_token;
  const emailOtp = properties.email_otp;
  console.log("Successfully generated token / OTP:", { hashedToken, emailOtp });

  // Let's get the target user ID
  const { data: { users }, error: usersError } = await adminClient.auth.admin.listUsers();
  if (usersError) {
    console.error("Error fetching users:", usersError);
    return;
  }

  const targetUser = users.find(u => u.email === targetEmail);
  if (!targetUser) {
    console.error(`Target user ${targetEmail} not found`);
    return;
  }

  // Now, let's sign in using the OTP or hashed token to get a session
  console.log(`Signing in as admin using OTP: ${emailOtp}`);
  const userClient = createClient(supabaseUrl, env['NEXT_PUBLIC_SUPABASE_ANON_KEY']);
  const { data: sessionData, error: sessionError } = await userClient.auth.verifyOtp({
    email: adminEmail,
    token: emailOtp,
    type: 'magiclink'
  });

  if (sessionError) {
    console.error("Error verifying OTP:", sessionError);
    return;
  }

  const accessToken = sessionData.session.access_token;
  console.log("Successfully retrieved admin access token!");

  // Initialize a client authenticated as the admin user
  const authenticatedClient = createClient(supabaseUrl, env['NEXT_PUBLIC_SUPABASE_ANON_KEY'], {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  });

  console.log(`Updating role of ${targetEmail} (ID: ${targetUser.id}) to admin...`);
  const { data: updateData, error: updateError } = await authenticatedClient
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', targetUser.id)
    .select();

  if (updateError) {
    console.error("Error performing update as admin:", updateError);
  } else {
    console.log("Success! Profile updated:", updateData);
  }
}

main();
