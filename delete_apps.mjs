import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://rdoxpefasbuwlkhorryi.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_pHNf20kvv9qD49lII5Lh2Q_3xh65pjm';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('Fetching initial apps from migrate_data.json...');
    const data = JSON.parse(fs.readFileSync('./src/data/migrate_data.json', 'utf8'));

    // We want to remove all except internal:home as that's the Home interface for the app
    const urlsToDelete = data.map(app => app.url).filter(url => url !== 'internal:home');
    console.log(`Found ${urlsToDelete.length} URLs to delete.`);

    // Note: RLS might block anon from deleting, but we will try. If it does, we will use a different approach.
    const { data: existingApps, error: fetchErr } = await supabase.from('apps').select('id, url, name');
    if (fetchErr) {
        console.error('Error fetching existing apps:', fetchErr);
        return;
    }

    console.log(`Found ${existingApps.length} apps currently in the DB.`);

    const appsToDelete = existingApps.filter(app => urlsToDelete.includes(app.url));
    console.log(`Matched ${appsToDelete.length} apps to delete from DB:`, appsToDelete.map(a => a.name));

    if (appsToDelete.length === 0) {
        console.log('No apps to delete. Exiting.');
        return;
    }

    for (const app of appsToDelete) {
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
