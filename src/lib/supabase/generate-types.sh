#!/bin/sh

source .env

pnpm dlx supabase gen types typescript --project-id $SUPABASE_PROJECT_ID --schema public > src/lib/supabase/types.ts