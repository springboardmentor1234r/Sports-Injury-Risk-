export default function ProgressBar({
    title,
    value,
}) {

    const numericValue = Number(value);

    const safeValue = Number.isFinite(numericValue)
        ? Math.min(100, Math.max(0, numericValue))
        : 0;


    return (

        <div className="landing-progress">

            <div className="landing-progress-heading">

                <span>
                    {title}
                </span>

                <strong>
                    {safeValue}%
                </strong>

            </div>


            <div
                className="landing-progress-track"
                role="progressbar"
                aria-valuenow={safeValue}
                aria-valuemin="0"
                aria-valuemax="100"
                aria-label={title}
            >

                <div
                    className="landing-progress-fill"
                    style={{
                        width: `${safeValue}%`,
                    }}
                />

            </div>

        </div>

    );

}