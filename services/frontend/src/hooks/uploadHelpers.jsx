import apiClient from "../../utils/apiClient";

export const createObjectUrlEntry = (file) => {
  const url = URL.createObjectURL(file);
  return { file, url };
};

export const revokeObjectUrl = (url) => {
  URL.revokeObjectURL(url);
};

export const uploadToServer = async (file, token) => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await apiClient.post("/uploads/upload_file/", formData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status !== 200 || res.data.status !== "ok") {
    throw new Error("Upload failed");
  }
  return res.data.data;
};
