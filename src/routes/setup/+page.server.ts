import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { getDb } from '$lib/server/db';
import { saveGitHubOAuth } from '$lib/server/settings/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = (event) => {
  // Shown so the user can register it as the OAuth app's callback URL.
  return { callbackUrl: `${event.url.origin}/auth/callback/github` };
};

const schema = z.object({
  clientId: z.string().trim().min(1, 'Client ID is required'),
  clientSecret: z.string().trim().min(1, 'Client secret is required'),
});

export const actions: Actions = {
  default: async ({ request }) => {
    const form = await request.formData();
    const parsed = schema.safeParse({
      clientId: form.get('clientId'),
      clientSecret: form.get('clientSecret'),
    });
    if (!parsed.success) {
      return fail(400, { errors: z.flattenError(parsed.error).fieldErrors });
    }
    saveGitHubOAuth(getDb(), parsed.data);
    redirect(303, '/login');
  },
};
