import supabase from "./supabase.js";
import { createReadStream } from "fs";
import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Upload PDF to Supabase bucket
export async function uploadFileToSupabase(tempFilePath, filename, phone) {
  const storagePath = `${phone}/${Date.now()}_${filename}`;
  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from("certificates")
    .upload(storagePath, createReadStream(tempFilePath), {
      contentType: "application/pdf",
      upsert: true,
    });

  
  if (error) throw new Error("❌ Upload failed: " + error.message);

  const { data: publicUrl } = supabase.storage
    .from("certificates")
    .getPublicUrl(storagePath);

  // Insert row into user_certificates table
  const { error: insertError } = await supabase
    .from("user_certificates")
    .insert([
      {
        id: uuidv4(),
        phone,
        file_url: publicUrl.publicUrl,
        uploaded_at: new Date().toISOString(),
      },
    ]);

if (insertError) {
  console.error("❌ DB insert failed (Supabase says):", insertError);
  throw new Error("❌ DB insert failed: " + insertError.message);
}
  return publicUrl.publicUrl;
}
