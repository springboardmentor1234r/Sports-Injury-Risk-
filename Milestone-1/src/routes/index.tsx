import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  Brain,
  Camera,
  LineChart,
  ShieldCheck,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import heroImage from "@/assets/hero.jpg";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "KinetIQ — AI Sports Injury Risk Detection from Video" },
      {
        name: "description",
        content:
          "Upload athlete video. Get pose estimation, biomechanical analysis, and personalized injury-risk scores in minutes.",
      },
    ],
  }),
});

const features = [
  {
    icon: Camera,
    title: "Video Ingestion",
    desc: "Upload training or match footage. Automatic frame extraction, quality checks and motion enhancement.",
  },
  {
    icon: Activity,
    title: "Pose Estimation",
    desc: "Keypoint tracking across head, shoulders, hips, knees and ankles for full skeletal motion analysis.",
  },
  {
    icon: Brain,
    title: "Biomechanical Insights",
    desc: "Joint angles, symmetry, landing mechanics, trunk lean and stride analysis in one report.",
  },
  {
    icon: ShieldCheck,
    title: "Injury Risk Scoring",
    desc: "ACL, hamstring, ankle, shoulder and lower-back risk categorised low, moderate, high or critical.",
  },
  {
    icon: LineChart,
    title: "Team Analytics",
    desc: "Coach and physiotherapist dashboards for movement quality trends across an entire roster.",
  },
  {
    icon: Sparkles,
    title: "Corrective Programs",
    desc: "Personalized mobility, strengthening and recovery drills tied to each risk factor detected.",
  },
];

const roles = ["Athletes", "Coaches", "Physiotherapists", "Sports Scientists"];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-gradient-primary text-primary-foreground">
              <Activity className="h-4 w-4" />
            </span>
            KinetIQ
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">Platform</a>
            <a href="#workflow" className="hover:text-foreground">Workflow</a>
            <a href="#roles" className="hover:text-foreground">For Teams</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/auth" search={{ mode: "signup" } as never}>Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 grid-bg opacity-60" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-20 md:grid-cols-2 md:py-28 md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3 w-3" /> Sports injury risk platform
            </div>
            <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] md:text-6xl">
              Predict injuries <span className="text-primary">before</span> they happen.
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">
              KinetIQ turns athlete video into biomechanical intelligence — pose estimation,
              movement quality scoring and personalized injury-risk assessment for elite sport.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/auth" search={{ mode: "signup" } as never}>
                  Create free account <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#features">Explore the platform</a>
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap gap-6 text-xs uppercase tracking-widest text-muted-foreground">
              {roles.map((r) => <span key={r}>{r}</span>)}
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-primary opacity-20 blur-2xl" />
            <img
              src={heroImage}
              alt="Athlete sprinting with pose-estimation skeleton overlay"
              width={1600}
              height={1000}
              className="relative rounded-2xl border border-border shadow-glow"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-24">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Platform</p>
          <h2 className="mt-3 font-display text-4xl font-bold">A full injury-intelligence stack.</h2>
          <p className="mt-4 text-muted-foreground">
            From raw video to actionable recommendations — every layer of the sports injury
            prediction workflow lives on one platform.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="group rounded-2xl border border-border bg-card p-6 shadow-card transition hover:border-primary/50">
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary transition group-hover:bg-gradient-primary group-hover:text-primary-foreground">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Workflow */}
      <section id="workflow" className="border-y border-border bg-card/40">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <h2 className="font-display text-4xl font-bold">How it works</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-4">
            {[
              ["01", "Register the athlete", "Capture sport, position, injury history and training load."],
              ["02", "Upload video", "Any device. Running, jumping, cutting, sport-specific drills."],
              ["03", "AI analyzes movement", "Pose estimation + biomechanical metrics + risk model."],
              ["04", "Act on insights", "Risk score, dashboards and corrective programs delivered."],
            ].map(([n, t, d]) => (
              <div key={n} className="rounded-2xl border border-border bg-background p-6">
                <div className="font-display text-3xl font-bold text-primary">{n}</div>
                <div className="mt-3 font-semibold">{t}</div>
                <p className="mt-2 text-sm text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="font-display text-4xl font-bold">Built for every role in performance.</h2>
            <p className="mt-4 text-muted-foreground">
              Role-based dashboards deliver the right insight to the right person. Athletes see
              personal risk scores and drills. Coaches see roster trends. Physios track
              rehabilitation. Sports scientists mine biomechanical data.
            </p>
            <Button asChild className="mt-6">
              <Link to="/auth" search={{ mode: "signup" } as never}>Get started free</Link>
            </Button>
          </div>
          <ul className="grid gap-3">
            {[
              ["Athlete", "Personal risk score, movement reports, corrective drills."],
              ["Coach", "Team risk overview, movement quality, training recommendations."],
              ["Physiotherapist", "Rehab tracking, movement corrections, recovery reports."],
              ["Sports Scientist", "Biomechanical analytics, injury prediction insights."],
            ].map(([r, d]) => (
              <li key={r} className="flex items-start gap-4 rounded-xl border border-border bg-card p-5">
                <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                <div>
                  <div className="font-semibold">{r}</div>
                  <div className="text-sm text-muted-foreground">{d}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="border-t border-border py-10 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} KinetIQ · AI Sports Injury Risk Detection Platform
      </footer>
    </div>
  );
}
