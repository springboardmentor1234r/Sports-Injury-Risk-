import { useState } from "react";
import { Upload, CheckCircle } from "lucide-react";
import api from "../services/api";

export default function UploadVideo() {

    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handleUpload = async () => {

        if (!file) {
            alert("Please select a video.");
            return;
        }

        try {

            setLoading(true);

            const formData = new FormData();
            formData.append("file", file);

            const token = localStorage.getItem("token");

            const response = await api.post(
                "/video/upload",
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            setResult(response.data);

            alert("Video Uploaded Successfully!");

        } catch (err) {

            console.log(err);

            alert("Upload Failed");

        } finally {

            setLoading(false);

        }

    };

    return (

        <div className="min-h-screen bg-[#050816] flex justify-center items-center px-6">

            <div className="w-full max-w-2xl bg-white/5 border border-white/10 rounded-3xl p-10">

                <h1 className="text-4xl font-bold text-white">

                    Upload Sports Video

                </h1>

                <p className="text-gray-400 mt-3">

                    Upload a cricket, football or badminton video for AI analysis.

                </p>

                <div className="mt-10 border-2 border-dashed border-blue-500 rounded-2xl p-10 text-center">

                    <Upload
                        className="mx-auto text-blue-400"
                        size={60}
                    />

                    <input
                        type="file"
                        accept="video/mp4"
                        onChange={(e)=>setFile(e.target.files[0])}
                        className="mt-8 text-white"
                    />

                </div>

                <button
                    onClick={handleUpload}
                    disabled={loading}
                    className="mt-8 w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-xl text-white font-bold"
                >

                    {
                        loading
                        ? "Uploading..."
                        : "Upload Video"
                    }

                </button>

                {
                    result && (

                        <div className="mt-10 bg-green-500/10 border border-green-500 rounded-2xl p-6">

                            <div className="flex items-center gap-3">

                                <CheckCircle className="text-green-400"/>

                                <h2 className="text-green-400 font-bold">

                                    Upload Successful

                                </h2>

                            </div>

                            <div className="mt-5 text-gray-300">

                                <p><b>Filename:</b> {result.filename}</p>

                                <p><b>ID:</b> {result.id}</p>

                                <p><b>Uploaded:</b> {result.uploaded_at}</p>

                            </div>

                        </div>

                    )
                }

            </div>

        </div>

    );

}