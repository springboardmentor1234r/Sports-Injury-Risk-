import axios from "axios";

// Milestone 4 — Reports & Export System. The report endpoints require an
// Authorization header, so a plain <a href> can't be used directly; fetch
// the file as a blob instead and trigger the browser's save dialog via a
// temporary anchor element.
export async function downloadFile(url, headers, filename) {
  const res = await axios.get(url, { headers, responseType: "blob" });
  const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement("a");
  link.href = blobUrl;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}
