import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";

export default function AnimatedBackground() {

    const particlesInit = async (engine) => {
        await loadSlim(engine);
    };

    return (

        <Particles

            id="tsparticles"

            init={particlesInit}

            options={{

                fullScreen: {
                    enable: true,
                    zIndex: -100,
                },

                background: {
                    color: "#050816",
                },

                fpsLimit: 60,

                particles: {

                    number: {
                        value: 45,
                    },

                    color: {
                        value: [
                            "#2563EB",
                            "#3B82F6",
                            "#60A5FA",
                        ],
                    },

                    links: {
                        enable: true,
                        distance: 170,
                        color: "#2563EB",
                        opacity: 0.15,
                    },

                    move: {
                        enable: true,
                        speed: 1,
                    },

                    opacity: {
                        value: 0.4,
                    },

                    size: {
                        value: {
                            min: 1,
                            max: 4,
                        },
                    },

                },

                detectRetina: true,

            }}

        />

    );

}