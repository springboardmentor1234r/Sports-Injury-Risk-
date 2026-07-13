import athlete from "../assets/images/athlete.jpg";
export default function HeroPreview() {
    return (
        <div className="relative">

            {/* Glow */}
            <div className="absolute -inset-5 bg-blue-600/20 blur-3xl rounded-full"></div>

            <div className="relative bg-white/5 backdrop-blur-xl border border-blue-500/20 rounded-3xl p-6 shadow-2xl w-[450px]">

                {/* Video */}

                <div className="rounded-2xl bg-slate-900 h-60 flex items-center justify-center overflow-hidden">

                    <img
                        src={athlete}
                        alt="Athlete"
                        className="w-full h-full object-cover rounded-2xl"
                    />

                </div>

                {/* Stats */}

                <div className="grid grid-cols-2 gap-4 mt-6">

                    <div className="bg-blue-600/10 rounded-xl p-4">

                        <p className="text-gray-400 text-sm">

                            Injury Risk

                        </p>

                        <h2 className="text-green-400 text-3xl font-bold">

                            LOW

                        </h2>

                    </div>

                    <div className="bg-blue-600/10 rounded-xl p-4">

                        <p className="text-gray-400 text-sm">

                            Balance

                        </p>

                        <h2 className="text-white text-3xl font-bold">

                            96%

                        </h2>

                    </div>

                    <div className="bg-blue-600/10 rounded-xl p-4">

                        <p className="text-gray-400 text-sm">

                            Knee Angle

                        </p>

                        <h2 className="text-white text-3xl font-bold">

                            156°

                        </h2>

                    </div>

                    <div className="bg-blue-600/10 rounded-xl p-4">

                        <p className="text-gray-400 text-sm">

                            Hip Rotation

                        </p>

                        <h2 className="text-white text-3xl font-bold">

                            42°

                        </h2>

                    </div>

                </div>

            </div>

        </div>
    );
}