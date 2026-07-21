import { supabase } from "@/lib/supabase";

export default async function TestConnectionPage() {
  const { data, error } = await supabase.from("sessions").select("*");

  if (error) {
    return (
      <main style={{ padding: "2rem", fontFamily: "monospace" }}>
        <h1>Connection failed</h1>
        <p style={{ color: "red" }}>{error.message}</p>
        <p>Check that your .env.local file has the correct NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY values.</p>
      </main>
    );
  }

  return (
    <main style={{ padding: "2rem", fontFamily: "monospace" }}>
      <h1>Connected! Sessions found: {data.length}</h1>
    </main>
  );
}
