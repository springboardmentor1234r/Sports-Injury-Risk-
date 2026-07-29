import { useEffect, useState } from "react";
import api from "../services/api";

export default function History() {

  const [videos, setVideos] = useState([]);

  useEffect(() => {

    loadHistory();

  }, []);

  const loadHistory = async () => {

    try {

      const token = localStorage.getItem("token");

      const res = await api.get(
        "/video/history",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setVideos(res.data);

    } catch (err) {

      console.log(err);

      alert("Cannot load history");

    }

  };

  return (

    <div className="min-h-screen bg-[#050816] p-10">

      <h1 className="text-4xl font-bold text-white mb-8">
        Upload History
      </h1>

      <div className="overflow-auto rounded-xl">

        <table className="w-full text-white">

          <thead className="bg-blue-700">

            <tr>

              <th className="p-4">ID</th>

              <th className="p-4">Filename</th>

              <th className="p-4">Upload Time</th>

              <th className="p-4">Video</th>

            </tr>

          </thead>

          <tbody>

            {

              videos.map((video)=>(

                <tr
                  key={video.id}
                  className="border-b border-gray-700"
                >

                  <td className="p-4">
                    {video.id}
                  </td>

                  <td className="p-4">
                    {video.filename}
                  </td>

                  <td className="p-4">
                    {new Date(video.uploaded_at).toLocaleString()}
                  </td>

                  <td className="p-4">

                    <a

                      href={`http://127.0.0.1:8000/${video.filepath.replace(/\\/g,"/")}`}

                      target="_blank"

                      rel="noreferrer"

                      className="bg-green-600 px-4 py-2 rounded-lg"

                    >

                      Open

                    </a>

                  </td>

                </tr>

              ))

            }

          </tbody>

        </table>

      </div>

    </div>

  );

}