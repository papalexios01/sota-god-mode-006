import { useState } from "react";
import { Zap, Sparkles, LayoutGrid, Shield } from "lucide-react";
import { OptimizerDashboard } from "@/components/optimizer/OptimizerDashboard";

const features = [
  {
    icon: Zap,
    title: "God Mode 2.0",
    description: "Autonomous content optimization that never sleeps. Set it and forget it while your content climbs the rankings 24/7.",
  },
  {
    icon: Sparkles,
    title: "Gap Analysis",
    description: "State-of-the-art content analysis using NLP, entity extraction, and competitor insights powered by NeuronWriter integration.",
  },
  {
    icon: LayoutGrid,
    title: "Bulk Publishing",
    description: "Generate and publish hundreds of optimized articles with one click. Scale your content empire effortlessly.",
  },
  {
    icon: Shield,
    title: "Rank Guardian",
    description: "Real-time monitoring and automatic fixes for content health. Protect your rankings 24/7 with AI-powered alerts.",
  },
];

const Index = () => {
  const [showOptimizer, setShowOptimizer] = useState(false);

  if (showOptimizer) {
    return <OptimizerDashboard />;
  }

  return (
    <div className="min-h-screen gradient-bg relative overflow-hidden">
      <div className="hero-orb hero-orb--one" aria-hidden="true" />
      <div className="hero-orb hero-orb--two" aria-hidden="true" />
      <div className="hero-orb hero-orb--three" aria-hidden="true" />

      {/* Header */}
      <header className="px-6 pt-6">
        <div className="max-w-7xl mx-auto glass-surface">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 px-6 py-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center shadow-glow">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="badge">Enterprise Suite</p>
                <h1 className="text-xl font-semibold text-foreground">
                  WP Content Optimizer <span className="text-primary">PRO</span>
                </h1>
                <p className="text-sm text-muted-foreground">
                  Enterprise-Grade SEO Automation by{" "}
                  <a href="https://affiliatemarketingforsuccess.com" className="text-primary hover:underline">
                    AffiliateMarketingForSuccess.com
                  </a>
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="pill">SOC 2 Ready</span>
              <span className="pill">Realtime NLP</span>
              <span className="pill">Global Teams</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="px-6 py-16 md:py-24">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-[1.05fr_0.95fr] gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 mb-6 badge-outline">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>AI Content Control Center</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold text-foreground leading-tight mb-4">
              Transform Your Content Into{" "}
              <span className="gradient-text">Ranking Machines</span>
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-8">
              AI-powered SEO optimization that adapts to Google in real time. Generate, optimize, and publish content that
              dominates search results with enterprise-grade governance.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setShowOptimizer(true)}
                className="button-primary"
              >
                <Zap className="w-5 h-5" />
                Launch Optimizer
              </button>
              <button className="button-secondary">
                <Sparkles className="w-5 h-5" />
                Explore SEO Arsenal
              </button>
            </div>

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: "Avg. lift", value: "+182%" },
                { label: "Articles shipped", value: "24K+" },
                { label: "Time saved", value: "3.4x" },
              ].map((stat) => (
                <div key={stat.label} className="stat-card">
                  <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="glass-card p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-muted-foreground">Live Optimizer</p>
                  <h3 className="text-xl font-semibold text-foreground">Ranking Control Room</h3>
                </div>
                <div className="pill pill--active">Online</div>
              </div>
              <div className="space-y-4">
                {[
                  { label: "Content Score", value: "96/100", trend: "Top 3 potential" },
                  { label: "Entity Coverage", value: "48 / 52", trend: "92% match" },
                  { label: "Publishing Queue", value: "128 tasks", trend: "Auto-scheduled" },
                ].map((item) => (
                  <div key={item.label} className="glass-row">
                    <div>
                      <p className="text-sm text-muted-foreground">{item.label}</p>
                      <p className="text-lg font-semibold text-foreground">{item.value}</p>
                    </div>
                    <span className="text-xs text-primary">{item.trend}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex items-center gap-3 text-sm text-muted-foreground">
                <Shield className="w-4 h-4 text-primary" />
                Compliance-ready audit trail for every optimization.
              </div>
            </div>
            <div className="floating-panel">
              <p className="text-xs text-muted-foreground">Realtime signal</p>
              <p className="text-sm font-semibold text-foreground">SERP volatility: Low</p>
              <div className="mt-2 h-2 w-full rounded-full bg-muted">
                <div className="h-2 w-3/4 rounded-full bg-primary shadow-glow" />
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="max-w-7xl mx-auto mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="feature-card"
            >
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mb-4 shadow-glow">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 pb-10">
        <div className="max-w-7xl mx-auto footer-surface">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-6 py-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-card/60 border border-border rounded-lg flex items-center justify-center">
                <span className="text-xs text-muted-foreground text-center leading-tight">
                  Affiliate<br />Marketing
                </span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Created by <span className="text-foreground font-medium">Alexios Papaioannou</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Owner of{" "}
                  <a href="https://affiliatemarketingforsuccess.com" className="text-primary hover:underline">
                    affiliatemarketingforsuccess.com
                  </a>
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center md:items-end gap-2">
              <span className="text-sm text-muted-foreground">Learn More About:</span>
              <div className="flex flex-wrap gap-4 text-sm">
                {["Affiliate Marketing", "AI", "SEO", "Blogging", "Reviews"].map((item) => (
                  <a
                    key={item}
                    href="#"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {item}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
