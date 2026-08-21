export default function AnimatedBackground() {

    return (

        <div
            className="fixed inset-0 -z-50 pointer-events-none"
            aria-hidden="true"
        >

            <div
                className="absolute inset-0"
                style={{
                    background: `
                        radial-gradient(
                            circle at 15% 10%,
                            rgba(37, 99, 235, 0.18),
                            transparent 40%
                        ),
                        radial-gradient(
                            circle at 85% 85%,
                            rgba(6, 182, 212, 0.12),
                            transparent 35%
                        ),
                        #050816
                    `,
                }}
            />

        </div>

    );

}