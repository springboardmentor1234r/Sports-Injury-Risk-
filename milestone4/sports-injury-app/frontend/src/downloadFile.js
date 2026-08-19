// downloadFile.js
// -----------------
// Downloads a protected file (PDF/Excel export) from the API.
//
// A plain <a href="..."> can't attach an Authorization header, and these
// export endpoints are auth-protected like everything else in this app --
// same constraint as the annotated-video playback fix in VideoAnalysisModal.
// The fix is the same pattern: fetch the file as an authenticated blob via
// the shared `api` instance, then trigger the browser's normal download
// behavior with a temporary, invisible link element.

import api from "./api";

export async function downloadFile(url, suggestedFilename) {
  const response = await api.get(url, { responseType: "blob" });

  // Prefer the filename the server actually set (via Content-Disposition)
  // over the caller's guess, if present.
  const disposition = response.headers["content-disposition"];
  let filename = suggestedFilename;
  if (disposition) {
    const match = disposition.match(/filename="?([^"]+)"?/);
    if (match) filename = match[1];
  }

  const blobUrl = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(blobUrl);
}
