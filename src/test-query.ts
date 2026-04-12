import { supabase } from './supabaseClient';

async function testQuery() {
  console.log("Testing error for UUID:", '22cc3fe4-4d53-431c-ba41-437e077c6b49');
  
  // Try a GET
  const getRes = await supabase.from('enrollments').select('*').eq('id', '22cc3fe4-4d53-431c-ba41-437e077c6b49');
  console.log("GET Result:", getRes.error || "Success");

  // Try a PATCH simulating AdminDashboard
  const patchRes1 = await supabase.from('enrollments').update({
    status: 'enrolled',
    approved_at: new Date().toISOString()
  }).eq('id', '22cc3fe4-4d53-431c-ba41-437e077c6b49');
  console.log("PATCH 1 (Admin Dash) Result:", patchRes1.error || "Success");

  // Try a PATCH simulating PendingApplications
  const patchRes2 = await supabase.from('enrollments').update({
    status: 'approved',
    approved_at: new Date().toISOString(),
    status_history: [{ status: 'approved', date: new Date().toISOString(), notes: 'test', updated_by: 'test' }]
  }).eq('id', '22cc3fe4-4d53-431c-ba41-437e077c6b49');
  console.log("PATCH 2 (Pending Apps) Result:", patchRes2.error || "Success");
}

testQuery();
