export default function DashboardCard({
    title,
    children,
    className = "",
}) {
    return (
        <div
            className={`
                bg-white/5
                backdrop-blur-xl
                border
                border-white/10
                rounded-3xl
                p-6
                shadow-lg
                hover:border-blue-500
                hover:shadow-blue-500/20
                transition-all
                duration-500
                ${className}
            `}
        >
            {title && (
                <h3 className="text-white text-xl font-bold mb-6">
                    {title}
                </h3>
            )}

            {children}
        </div>
    );
}