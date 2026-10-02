import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://rzrxljijijowmfoedwoe.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_1nJN7L3LOtAb_dwqguZtfw_nJpxPwm5';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkDatabase() {
  console.log('----------------------------------------------------');
  console.log(' Mikesta Supabase Diagnostic & Seeding Tool');
  console.log('----------------------------------------------------');
  console.log(`Endpoint: ${SUPABASE_URL}`);

  try {
    const [posts, profiles, comments, likes, savedPosts, follows] = await Promise.all([
      supabase.from('posts').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('comments').select('*', { count: 'exact', head: true }),
      supabase.from('likes').select('*', { count: 'exact', head: true }),
      supabase.from('saved_posts').select('*', { count: 'exact', head: true }),
      supabase.from('follows').select('*', { count: 'exact', head: true }),
    ]);

    console.log('\n📊 Remote Database Table Status:');
    console.log(`  - posts:        ${posts.count ?? 0} rows`);
    console.log(`  - profiles:     ${profiles.count ?? 0} rows`);
    console.log(`  - comments:     ${comments.count ?? 0} rows`);
    console.log(`  - likes:        ${likes.count ?? 0} rows`);
    console.log(`  - saved_posts:  ${savedPosts.count ?? 0} rows`);
    console.log(`  - follows:      ${follows.count ?? 0} rows`);

    if ((posts.count ?? 0) === 0) {
      console.log('\n💡 Database Notice:');
      console.log('  Remote tables are currently empty or waiting for initial seed.');
      console.log('  -> To seed remote Supabase tables, run "supabase-seed.sql" in your Supabase SQL Editor:');
      console.log('     https://supabase.com/dashboard/project/rzrxljijijowmfoedwoe/sql');
      console.log('\n✨ Local Application State:');
      console.log('  The frontend automatically loads complete seed fixtures with high-resolution photography,');
      console.log('  active stories, comments, and creator profiles so the app is instantly rich and usable.');
    } else {
      console.log('\n✅ Remote database is seeded and operational.');
    }
  } catch (err) {
    console.error('Diagnostic error:', err);
  }
}

checkDatabase();
