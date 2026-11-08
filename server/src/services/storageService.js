const supabase = require("../config/supabase");

const bucket = process.env.SUPABASE_STORAGE_BUCKET;

const uploadToStorage = async ({
  storageKey,
  fileBuffer,
  mimeType,
}) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(storageKey, fileBuffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw error;
  }

  return data;
};

const downloadFromStorage = async (storageKey) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .download(storageKey);

  if (error) {
    throw error;
  }

  const arrayBuffer = await data.arrayBuffer();

  return Buffer.from(arrayBuffer);
};

const deleteFromStorage = async (storageKey) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .remove([storageKey]);

  if (error) {
    throw error;
  }

  return data;
};

module.exports = {
  uploadToStorage,
  downloadFromStorage,
  deleteFromStorage,
};