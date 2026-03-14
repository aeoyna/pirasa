import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://rdoxpefasbuwlkhorryi.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_pHNf20kvv9qD49lII5Lh2Q_3xh65pjm';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('Fetching all apps...');

    const { data: existingApps, error: fetchErr } = await supabase.from('apps').select('id, name');
    if (fetchErr) {
        console.error('Error fetching existing apps:', fetchErr);
        return;
    }

    console.log(`Found ${existingApps.length} apps currently in the DB.`);

    if (existingApps.length === 0) {
        console.log('No apps to delete. Exiting.');
        return;
    }

    // Delete them one by one to avoid any potential RLS batch limits, though batch delete usually works
    for (const app of existingApps) {
        console.log(`Deleting ${app.name} (${app.id})...`);
        const { error } = await supabase.from('apps').delete().eq('id', app.id);
        if (error) {
            console.error(`Failed to delete ${app.name}:`, error);
        } else {
            console.log(`Successfully deleted ${app.name}`);
        }
    }
    console.log('Done!');
}

run();
