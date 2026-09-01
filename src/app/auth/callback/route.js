import { createClient } from "@/lib/supabase/server";

import { NextResponse } from "next/server";

/**
 * This callback route receives the OAuth authorization code
 * that Google sends back to our application after the user
 * successfully authenticates with Google.
 */
export async function GET(req) {

  try {

    /**
     * Get the URL from the incoming request (`req.url`) and
     * convert it into a JavaScript URL object.
     *
     * For example, after Google OAuth, the incoming URL might be:
     *
     * http://localhost:3000/auth/callback?code=ABC123XYZ
     *
     * The URL object provides a `searchParams` property that
     * contains the query parameters from the URL.
     *
     * So, `searchParams` will contain:
     *
     * ?code=ABC123XYZ
     *
     * We extract `searchParams` from the URL object using object
     * destructuring so that we can later get the `code` sent by Google.
     */
    const { searchParams } = new URL(req?.url);


    const code = searchParams.get("code");


    if (code) {

      const supabaseClient = await createClient();

      /**
       * Exchange the OAuth authorization `code` received from Google
       * for a Supabase session.
       *
       * The `code` is a temporary authorization code that Google sends
       * to our `/auth/callback` route after the user successfully signs in.
       *
       * Supabase verifies this code with the OAuth provider and, if it is
       * valid, creates a session for the user.
       *
       * This session allows our application to recognize the user as
       * authenticated and access their Supabase account/data.
       *
       * For example:
       *
       * code → "ABC123XYZ"
       *   ↓
       * Supabase exchanges the code for a user session
       *   ↓
       * User is now signed in to our application
       */
      await supabaseClient.auth.exchangeCodeForSession(code);

    }

    /**
     * Create the URL for the home page (`/`) using the current
     * request URL (`req?.url`) as the base URL.
     *
     * For example, if the current request URL is:
     *
     * http://localhost:3000/auth/callback?code=ABC123
     *
     * then:
     *
     * new URL("/", req?.url)
     * → http://localhost:3000/
     *
     * In production, if the current request URL is:
     *
     * https://myapp.com/auth/callback?code=ABC123
     *
     * then:
     *
     * new URL("/", req?.url)
     * → https://myapp.com/
     *
     * This allows us to redirect the user to the home page without
     * hard-coding the application's domain.
     */
    return NextResponse.redirect(new URL("/", req?.url));

  } catch (error) {

    console.log(error);

  }

}
