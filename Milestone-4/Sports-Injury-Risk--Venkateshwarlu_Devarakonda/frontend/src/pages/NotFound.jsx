import {
    AlertTriangle,
    ArrowLeft,
    Home,
} from "lucide-react";

import {
    Link,
} from "react-router-dom";

import ThemeToggle from "../components/ThemeToggle";

export default function NotFound() {
    return (
        <div className="auth-page">

            {/* Theme */}

            <div className="auth-theme-control">
                <ThemeToggle />
            </div>

            {/* Content */}

            <div className="w-full max-w-2xl">

                <section className="ui-card p-10 md:p-14 text-center">

                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
                        <AlertTriangle size={32} />
                    </div>

                    <p
                        className="mt-6 text-sm font-bold uppercase tracking-[0.18em]"
                        style={{
                            color:
                                "var(--primary)",
                        }}
                    >
                        Error 404
                    </p>

                    <h1
                        className="mt-3 text-5xl md:text-6xl font-black"
                        style={{
                            color:
                                "var(--text)",
                        }}
                    >
                        Page Not Found
                    </h1>

                    <p
                        className="mx-auto mt-5 max-w-xl leading-7"
                        style={{
                            color:
                                "var(--text-secondary)",
                        }}
                    >
                        The page you are looking for
                        does not exist, was moved, or
                        is no longer available.
                    </p>

                    <div className="mt-8 flex flex-wrap justify-center gap-3">

                        <Link
                            to="/"
                            className="btn btn-primary"
                        >
                            <Home size={18} />
                            Home
                        </Link>

                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() =>
                                window.history.back()
                            }
                        >
                            <ArrowLeft size={18} />
                            Go Back
                        </button>

                    </div>

                </section>

            </div>
        </div>
    );
}