import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Features from "../components/Features";
import HowItWorks from "../components/HowItWorks";
import CTA from "../components/CTA";
import Footer from "../components/Footer";


export default function Landing() {

    return (
        <div className="landing-page">

            <Navbar />

            <main>

                {/* ==================================================
                    HERO
                    ================================================== */}

                <Hero />


                {/* ==================================================
                    FEATURES
                    ================================================== */}

                <Features />


                {/* ==================================================
                    HOW IT WORKS
                    ================================================== */}

                <HowItWorks />


                {/* ==================================================
                    FINAL CALL TO ACTION
                    ================================================== */}

                <CTA />

            </main>


            {/* ==================================================
                FOOTER
                ================================================== */}

            <Footer />

        </div>
    );
}