export default function AnimatedBackground() {
    return (
        <div
            className="fixed inset-0 -z-50"
            style={{
                background: `
                    radial-gradient(circle at top left, rgba(37,99,235,0.18), transparent 40%),
                    radial-gradient(circle at bottom right, rgba(6,182,212,0.12), transparent 35%),
                    #050816
                `
            }}
        />
    );
}