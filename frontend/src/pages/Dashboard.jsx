import {
    Upload,
    Activity,
    ShieldCheck,
    FileBarChart,
    PlayCircle,
} from "lucide-react";

import { Link } from "react-router-dom";

export default function Dashboard() {

    return (

        <div className="min-h-screen bg-[#050816] text-white">

            {/* Navbar */}

            <nav className="h-20 border-b border-white/10 flex justify-between items-center px-10">

                <h1 className="text-3xl font-bold text-blue-500">

                    SportSense AI

                </h1>

                <div className="flex gap-6">

                    <Link to="/upload">

                        <button className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl">

                            Upload Video

                        </button>

                    </Link>

                </div>

            </nav>

            <div className="max-w-7xl mx-auto px-8 py-12">

                {/* Welcome */}

                <div className="mb-12">

                    <h1 className="text-5xl font-bold">

                        Welcome Athlete 👋

                    </h1>

                    <p className="text-gray-400 mt-3 text-lg">

                        Monitor your biomechanics and detect injury risks using AI.

                    </p>

                </div>

                {/* Cards */}

                <div className="grid md:grid-cols-4 gap-6">

                    <Card
                        icon={<Upload size={30}/>}
                        title="Videos Uploaded"
                        value="5"
                    />

                    <Card
                        icon={<Activity size={30}/>}
                        title="AI Analyses"
                        value="5"
                    />

                    <Card
                        icon={<ShieldCheck size={30}/>}
                        title="Current Risk"
                        value="LOW"
                    />

                    <Card
                        icon={<FileBarChart size={30}/>}
                        title="Accuracy"
                        value="98%"
                    />

                </div>

                {/* Recent Analyses */}

                <div className="mt-16 bg-white/5 rounded-3xl border border-white/10 p-8">

                    <h2 className="text-3xl font-bold mb-8">

                        Recent Analyses

                    </h2>

                    <table className="w-full">

                        <thead>

                            <tr className="text-left text-gray-400">

                                <th>Video</th>

                                <th>Sport</th>

                                <th>Risk</th>

                                <th>Accuracy</th>

                            </tr>

                        </thead>

                        <tbody>

                            <Row
                                video="cricket_coverdrive.mp4"
                                sport="Cricket"
                                risk="Low"
                                accuracy="98%"
                            />

                            <Row
                                video="football_sprint.mp4"
                                sport="Football"
                                risk="Medium"
                                accuracy="95%"
                            />

                            <Row
                                video="badminton_smash.mp4"
                                sport="Badminton"
                                risk="Low"
                                accuracy="96%"
                            />

                        </tbody>

                    </table>

                </div>

                {/* Upload Section */}

                <div className="mt-16 bg-gradient-to-r from-blue-700 to-cyan-600 rounded-3xl p-10 flex justify-between items-center">

                    <div>

                        <h2 className="text-3xl font-bold">

                            Analyze a New Video

                        </h2>

                        <p className="mt-3 text-blue-100">

                            Upload a sports video to receive AI-powered injury prediction.

                        </p>

                    </div>

                    <Link to="/upload">

                        <button className="bg-white text-blue-700 px-8 py-4 rounded-xl font-bold flex gap-3 items-center">

                            <PlayCircle />

                            Upload Now

                        </button>

                    </Link>

                </div>

            </div>

        </div>

    );

}

function Card({icon,title,value}){

    return(

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">

            <div className="text-blue-400">

                {icon}

            </div>

            <h3 className="text-gray-400 mt-5">

                {title}

            </h3>

            <h2 className="text-4xl font-bold mt-3">

                {value}

            </h2>

        </div>

    );

}

function Row({video,sport,risk,accuracy}){

    return(

        <tr className="border-t border-white/10 h-16">

            <td>{video}</td>

            <td>{sport}</td>

            <td>

                <span className="bg-green-500/20 text-green-400 px-4 py-1 rounded-full">

                    {risk}

                </span>

            </td>

            <td>{accuracy}</td>

        </tr>

    );

}