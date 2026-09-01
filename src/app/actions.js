"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";


export async function signOutUser() {

  try {

    const supabaseClient = await createClient();

    await supabaseClient.auth.signOut();

    revalidatePath("/");

    redirect("/");

  } catch (error) {

    console.log(error);

  }
  
}
