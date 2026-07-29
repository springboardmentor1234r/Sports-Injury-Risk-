export default function StepCard({

    number,
    title,
    description

}) {

    return (

        <div className="relative group">

            {/* Vertical Line */}

            {number !== "04" && (

                <div className="absolute left-8 top-20 w-1 h-24 bg-gradient-to-b from-blue-500 to-transparent"></div>

            )}

            <div className="flex gap-6 items-start">

                {/* Number */}

                <div
                    className="
                    w-16
                    h-16
                    rounded-full
                    bg-blue-600
                    flex
                    items-center
                    justify-center
                    text-white
                    font-bold
                    text-xl
                    shadow-lg
                    shadow-blue-500/40
                "
                >

                    {number}

                </div>

                {/* Card */}

                <div
                    className="
                    flex-1
                    bg-white/5
                    backdrop-blur-xl
                    border
                    border-white/10
                    rounded-3xl
                    p-8
                    transition
                    duration-500
                    hover:border-blue-500
                    hover:-translate-y-2
                "
                >

                    <h2 className="text-2xl font-bold text-white">

                        {title}

                    </h2>

                    <p className="text-gray-400 mt-4 leading-8">

                        {description}

                    </p>

                </div>

            </div>

        </div>

    );

}