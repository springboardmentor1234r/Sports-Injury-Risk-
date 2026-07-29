export default function FeatureCard({

    icon,
    title,
    description

}) {

    return (

        <div
            className="
            group
            relative
            overflow-hidden
            bg-white/5
            backdrop-blur-xl
            border
            border-white/10
            rounded-3xl
            p-8
            transition-all
            duration-500
            hover:-translate-y-3
            hover:border-blue-500
            hover:shadow-[0_20px_50px_rgba(37,99,235,0.25)]
        "
        >

            {/* Background Glow */}

            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-blue-600/10 blur-3xl opacity-0 group-hover:opacity-100 transition duration-500"></div>

            <div className="relative z-10">

                <div
                    className="
                    w-16
                    h-16
                    rounded-2xl
                    bg-blue-600/20
                    flex
                    items-center
                    justify-center
                    text-blue-400
                    mb-6
                "
                >

                    {icon}

                </div>

                <h3 className="text-2xl font-bold text-white mb-4">

                    {title}

                </h3>

                <p className="text-gray-400 leading-8">

                    {description}

                </p>

            </div>

        </div>

    );

}