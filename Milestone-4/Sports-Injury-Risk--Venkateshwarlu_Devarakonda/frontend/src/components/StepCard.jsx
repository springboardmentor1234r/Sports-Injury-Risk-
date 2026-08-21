export default function StepCard({
    number,
    title,
    description,
}) {

    const isLastStep = number === "04";


    return (

        <div className="relative group">

            {/* Connector */}

            {!isLastStep && (

                <div
                    className="
                        absolute
                        left-8
                        top-20
                        w-px
                        h-24
                        bg-gradient-to-b
                        from-blue-500
                        via-cyan-400
                        to-transparent
                    "
                    aria-hidden="true"
                />

            )}


            <div className="flex gap-6 items-start">

                {/* Number */}

                <div
                    className="
                        relative
                        z-10
                        shrink-0
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
                        border
                        border-blue-400/30
                    "
                >

                    {number}

                </div>


                {/* Content */}

                <div
                    className="
                        flex-1
                        bg-white/5
                        backdrop-blur-xl
                        border
                        border-white/10
                        rounded-3xl
                        p-8
                        transition-all
                        duration-500
                        hover:border-blue-500/50
                        hover:-translate-y-2
                        hover:shadow-xl
                        hover:shadow-blue-500/10
                    "
                >

                    <h2
                        className="
                            text-2xl
                            font-bold
                            text-white
                        "
                    >

                        {title}

                    </h2>


                    <p
                        className="
                            text-gray-400
                            mt-4
                            leading-8
                        "
                    >

                        {description}

                    </p>

                </div>

            </div>

        </div>

    );

}