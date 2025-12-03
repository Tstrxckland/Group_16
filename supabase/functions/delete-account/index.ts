import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    console.error(
      "Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or SUPABASE_ANON_KEY env vars",
    );
    return new Response(JSON.stringify({ error: "Service misconfigured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("Authorization");
  const accessToken = authHeader?.replace("Bearer ", "");

  if (!accessToken) {
    return new Response(JSON.stringify({ error: "Missing access token" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Client tied to the user JWT, used only to identify the current user
  const supabaseUserClient = createClient(supabaseUrl, anonKey, {
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Admin client with service role key, used for privileged operations
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    // 1. Get the authenticated user via the JWT-bound client
    const {
      data: { user },
      error: userError,
    } = await supabaseUserClient.auth.getUser();

    if (userError || !user) {
      console.error("Error fetching user", userError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    // 2. Find profiles linked to this user (admin client bypasses RLS)
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("user_id", userId);

    if (profilesError) {
      console.error("Error fetching profiles", profilesError);
      return new Response(JSON.stringify({ error: "Failed to load profiles" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const profileIds = (profiles ?? []).map((p: { id: string }) => p.id);

    if (profileIds.length > 0) {
      // 3. Find friendships involving these profiles
      const { data: friendships, error: friendshipsError } = await supabaseAdmin
        .from("friendships")
        .select("id")
        .or(
          `requester_profile_id.in.(${profileIds.join(",")}),addressee_profile_id.in.(${profileIds.join(",")})`,
        );

      if (friendshipsError) {
        console.error("Error fetching friendships", friendshipsError);
        return new Response(
          JSON.stringify({ error: "Failed to load friendships" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      const friendshipIds = (friendships ?? []).map((f: { id: string }) => f.id);

      // 4. Delete messages tied to these friendships or profiles
      if (friendshipIds.length > 0) {
        const { error: deleteMessagesByFriendshipError } = await supabaseAdmin
          .from("messages")
          .delete()
          .in("friendship_id", friendshipIds);

        if (deleteMessagesByFriendshipError) {
          console.error(
            "Error deleting messages by friendship",
            deleteMessagesByFriendshipError,
          );
          return new Response(
            JSON.stringify({ error: "Failed to delete messages" }),
            {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }
      }

      const { error: deleteMessagesByProfileError } = await supabaseAdmin
        .from("messages")
        .delete()
        .in("sender_profile_id", profileIds);

      if (deleteMessagesByProfileError) {
        console.error(
          "Error deleting messages by profile",
          deleteMessagesByProfileError,
        );
        return new Response(
          JSON.stringify({ error: "Failed to delete messages" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      // 5. Delete friendships
      if (friendshipIds.length > 0) {
        const { error: deleteFriendshipsError } = await supabaseAdmin
          .from("friendships")
          .delete()
          .in("id", friendshipIds);

        if (deleteFriendshipsError) {
          console.error("Error deleting friendships", deleteFriendshipsError);
          return new Response(
            JSON.stringify({ error: "Failed to delete friendships" }),
            {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }
      }

      // 6. Delete profiles
      const { error: deleteProfilesError } = await supabaseAdmin
        .from("profiles")
        .delete()
        .in("id", profileIds);

      if (deleteProfilesError) {
        console.error("Error deleting profiles", deleteProfilesError);
        return new Response(
          JSON.stringify({ error: "Failed to delete profiles" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    }

    // 7. Delete the auth user (removes email/password)
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(
      userId,
    );

    if (deleteUserError) {
      console.error("Error deleting auth user", deleteUserError);
      return new Response(
        JSON.stringify({ error: "Failed to delete account" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error in delete-account function", err);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
