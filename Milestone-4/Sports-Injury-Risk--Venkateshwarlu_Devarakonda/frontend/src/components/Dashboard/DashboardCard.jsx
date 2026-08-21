export default function DashboardCard({
    title,
    children,
}) {

    return (

        <section className="landing-dashboard-card">

            <div className="landing-dashboard-card-header">

                <h3>
                    {title}
                </h3>

            </div>


            <div className="landing-dashboard-card-body">

                {children}

            </div>

        </section>

    );

}