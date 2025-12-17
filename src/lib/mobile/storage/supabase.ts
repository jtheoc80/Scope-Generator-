import { createClient } from "@supabase/supabase-js";

function requireEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is required`);
  return v;
}

export type SupabasePresignPutResult = {
  key: string;
  uploadUrl: string;
  token: string;
  publicUrl: string;
};

function getSupabaseAdmin() {
  const url = requireEnv("SUPABASE_URL");
  const key = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function presignSupabaseUpload(params: {
  key: string;
}): Promise<SupabasePresignPutResult> {
  const bucket = requireEnv("SUPABASE_STORAGE_BUCKET");
  const url = requireEnv("SUPABASE_URL");

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUploadUrl(params.key);

  if (error || !data?.signedUrl || !data?.token) {
    throw new Error(error?.message || "SUPABASE_SIGNED_UPLOAD_FAILED");
  }

  // Assumes the bucket is public so Rekognition/GPT can fetch by URL.
  // If you keep buckets private, switch vision to download bytes server-side.
  const publicUrl = `${url.replace(/\/+$/, "")}/storage/v1/object/public/${bucket}/${params.key}`;

  return {
    key: params.key,
    uploadUrl: data.signedUrl,
    token: data.token,
    publicUrl,
  };
}
