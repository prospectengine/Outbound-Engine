import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Load .env.local manually
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...vals] = trimmed.split("=");
    if (key && vals.length > 0) {
      process.env[key.trim()] = vals.join("=").trim();
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function main() {
  console.log("Supabase URL:", supabaseUrl);
  const clientA = createClient(supabaseUrl, supabaseAnonKey);

  const testEmailA = `outbound.tenant.a.${Date.now()}@gmail.com`;
  const testPassword = "TestPassword123!@#";

  console.log("Attempting signUp for User A:", testEmailA);
  const { data: signUpDataA, error: signUpErrorA } = await clientA.auth.signUp({
    email: testEmailA,
    password: testPassword,
  });

  if (signUpErrorA) {
    console.error("SignUp User A failed:", signUpErrorA.message);
    return;
  }

  console.log(
    "SignUp User A result session:",
    signUpDataA.session ? "Active session created" : "No session (Email confirmation required)"
  );
  console.log("User A details:", signUpDataA.user?.id, signUpDataA.user?.email);

  if (!signUpDataA.session) {
    console.log("Email confirmation is required. Checking signInWithPassword...");
    const { data: signInDataA, error: signInErrorA } = await clientA.auth.signInWithPassword({
      email: testEmailA,
      password: testPassword,
    });
    console.log("SignIn User A error:", signInErrorA?.message);
    console.log("SignIn User A session:", signInDataA.session ? "Active" : "None");
  }
}

main().catch(console.error);
