import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { 
  Cpu, 
  ChevronRight, 
  Sparkles, 
  Shield, 
  Zap, 
  Settings,
  CheckCircle2,
  Layers,
  TrendingUp,
  Clock,
  Award,
  Users,
  Wrench,
  Package,
  Play,
  User,
  Menu,
  X
} from "lucide-react";
import { useAuthStore } from "~/stores/useAuthStore";
import { InteractivePCView } from "~/components/InteractivePCView";
import { BlogCard } from "~/components/BlogCard";
import { AdBanner } from "~/components/AdBanner";

export const Route = createFileRoute("/")({
  component: Home,
});

const categories = [
  "Gaming",
  "Content Creation",
  "AI/ML Development",
  "Video Editing",
  "Office/Productivity",
  "Budget Gaming",
  "Developers",
  "Trading",
  "General Use",
  "Workstation",
  "Server/NAS",
  "Streaming",
  "Mining/Crypto",
  "Home Theater PC",
  "Compact/Mini PC",
  "Extreme Performance",
];

function Home() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const { token, email, role } = useAuthStore();
  const [category, setCategory] = useState("Gaming");
  const [budget, setBudget] = useState(100000);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const featuredBuildsQuery = useQuery(
    trpc.getFeaturedBuilds.queryOptions()
  );

  const blogPostsQuery = useQuery(
    trpc.getHomepageBlogs.queryOptions({ limit: 6 })
  );

  const handleBuildMyPC = () => {
    navigate({
      to: "/build",
      search: { category, budget },
    });
  };

  const formatPrice = (price: number) => {
    return `₹${(price / 1000).toFixed(0)}k`;
  };

  // Get first featured build for InteractivePCView
  const firstBuild = featuredBuildsQuery.data?.[0];
  const interactiveParts = firstBuild?.parts as Array<{
    category: string;
    name: string;
    asin: string;
    price: number;
    specs: Record<string, any>;
  }> | undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate({ to: "/" })}
              className="flex items-center gap-2 cursor-pointer transition hover:opacity-80"
            >
              <Cpu className="h-7 w-7 text-blue-400" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                pcforgeai
              </span>
            </button>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2 flex-wrap">
              <button
                onClick={() => navigate({ to: "/products" })}
                className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                Browse Components
              </button>
              <button
                onClick={() => navigate({ to: "/laptops" })}
                className="rounded-lg bg-purple-500/20 px-4 py-2 text-sm font-medium text-purple-300 backdrop-blur-sm transition hover:bg-purple-500/30 border border-purple-500/30"
              >
                Browse Laptops
              </button>
              <button
                onClick={() => navigate({ to: "/monitors" })}
                className="rounded-lg bg-blue-500/20 px-4 py-2 text-sm font-medium text-blue-300 backdrop-blur-sm transition hover:bg-blue-500/30 border border-blue-500/30"
              >
                Browse Monitors
              </button>
              <button
                onClick={() => navigate({ to: "/headsets" })}
                className="rounded-lg bg-pink-500/20 px-4 py-2 text-sm font-medium text-pink-300 backdrop-blur-sm transition hover:bg-pink-500/30 border border-pink-500/30"
              >
                Browse Headsets
              </button>
              <button
                onClick={() => navigate({ to: "/mini-pcs" })}
                className="rounded-lg bg-green-500/20 px-4 py-2 text-sm font-medium text-green-300 backdrop-blur-sm transition hover:bg-green-500/30 border border-green-500/30"
              >
                Browse Mini PCs
              </button>
              {token ? (
                <>
                  <button
                    onClick={() => navigate({ to: role === "admin" ? "/admin/dashboard" : "/account" })}
                    className="flex items-center gap-2 rounded-lg bg-blue-500/20 px-4 py-2 text-sm font-medium text-blue-300 backdrop-blur-sm transition hover:bg-blue-500/30 border border-blue-500/30"
                  >
                    <User className="h-4 w-4" />
                    {email}
                  </button>
                  {role === "admin" && (
                    <button
                      onClick={() => navigate({ to: "/admin/dashboard" })}
                      className="rounded-lg bg-purple-500/20 px-4 py-2 text-sm font-medium text-purple-300 backdrop-blur-sm transition hover:bg-purple-500/30 border border-purple-500/30"
                    >
                      Admin Dashboard
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={() => navigate({ to: "/login" })}
                    className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/20"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => navigate({ to: "/register" })}
                    className="rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:shadow-lg hover:shadow-blue-500/50"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden rounded-lg bg-white/10 p-2 text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Menu Sidebar */}
        <div
          className={`fixed right-0 top-0 h-full w-64 transform bg-slate-900 shadow-xl transition-transform duration-300 ease-in-out md:hidden ${
            isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-white/10 p-4">
            <span className="text-lg font-bold text-white">Menu</span>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="rounded-lg bg-white/10 p-2 text-white transition hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex flex-col gap-2 p-4">
            <button
              onClick={() => {
                navigate({ to: "/products" });
                setIsMobileMenuOpen(false);
              }}
              className="rounded-lg bg-white/10 px-4 py-3 text-left text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              Browse Components
            </button>
            <button
              onClick={() => {
                navigate({ to: "/laptops" });
                setIsMobileMenuOpen(false);
              }}
              className="rounded-lg bg-purple-500/20 px-4 py-3 text-left text-sm font-medium text-purple-300 backdrop-blur-sm transition hover:bg-purple-500/30 border border-purple-500/30"
            >
              Browse Laptops
            </button>
            <button
              onClick={() => {
                navigate({ to: "/monitors" });
                setIsMobileMenuOpen(false);
              }}
              className="rounded-lg bg-blue-500/20 px-4 py-3 text-left text-sm font-medium text-blue-300 backdrop-blur-sm transition hover:bg-blue-500/30 border border-blue-500/30"
            >
              Browse Monitors
            </button>
            <button
              onClick={() => {
                navigate({ to: "/headsets" });
                setIsMobileMenuOpen(false);
              }}
              className="rounded-lg bg-pink-500/20 px-4 py-3 text-left text-sm font-medium text-pink-300 backdrop-blur-sm transition hover:bg-pink-500/30 border border-pink-500/30"
            >
              Browse Headsets
            </button>
            <button
              onClick={() => {
                navigate({ to: "/mini-pcs" });
                setIsMobileMenuOpen(false);
              }}
              className="rounded-lg bg-green-500/20 px-4 py-3 text-left text-sm font-medium text-green-300 backdrop-blur-sm transition hover:bg-green-500/30 border border-green-500/30"
            >
              Browse Mini PCs
            </button>
            
            <div className="my-2 border-t border-white/10" />
            
            {token ? (
              <>
                <button
                  onClick={() => {
                    navigate({ to: role === "admin" ? "/admin/dashboard" : "/account" });
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 rounded-lg bg-blue-500/20 px-4 py-3 text-sm font-medium text-blue-300 backdrop-blur-sm transition hover:bg-blue-500/30 border border-blue-500/30"
                >
                  <User className="h-4 w-4" />
                  {email}
                </button>
                {role === "admin" && (
                  <button
                    onClick={() => {
                      navigate({ to: "/admin/dashboard" });
                      setIsMobileMenuOpen(false);
                    }}
                    className="rounded-lg bg-purple-500/20 px-4 py-3 text-left text-sm font-medium text-purple-300 backdrop-blur-sm transition hover:bg-purple-500/30 border border-purple-500/30"
                  >
                    Admin Dashboard
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    navigate({ to: "/login" });
                    setIsMobileMenuOpen(false);
                  }}
                  className="rounded-lg bg-white/10 px-4 py-3 text-left text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/20"
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    navigate({ to: "/register" });
                    setIsMobileMenuOpen(false);
                  }}
                  className="rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-3 text-sm font-medium text-white backdrop-blur-sm transition hover:shadow-lg hover:shadow-blue-500/50"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 lg:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-10">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-500/20 px-4 py-2 text-sm font-medium text-blue-300 backdrop-blur-sm border border-blue-500/30">
              <Sparkles className="h-4 w-4" />
              AI-Powered PC Configuration
            </div>
            
            <h1 className="mb-4 text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl">
              Build Your Dream PC
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                In Minutes
              </span>
            </h1>
            
            <p className="mb-8 text-lg text-gray-300 max-w-2xl mx-auto">
              Get AI-generated custom PC builds optimized for your needs and budget.
              100% compatible components with Amazon India affiliate links.
            </p>
          </div>

          {/* Build Configuration */}
          <div className="mx-auto max-w-2xl rounded-2xl bg-white/10 p-6 backdrop-blur-md border border-white/20">
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Select Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-white backdrop-blur-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat} className="bg-slate-800">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Budget: {formatPrice(budget)}
                </label>
                <input
                  type="range"
                  min="25000"
                  max="500000"
                  step="5000"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-white/20 accent-blue-500 mt-2.5"
                />
                <div className="mt-1 flex justify-between text-xs text-gray-400">
                  <span>₹25k</span>
                  <span>₹5L</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleBuildMyPC}
              className="group flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-8 py-3.5 text-lg font-semibold text-white shadow-lg shadow-blue-500/50 transition hover:shadow-xl hover:shadow-blue-500/60 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Play className="h-5 w-5" />
              Build My PC
              <ChevronRight className="h-5 w-5 transition group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </section>

      {/* Banner Ad - Homepage Top */}
      <section className="container mx-auto px-4 py-8">
        <AdBanner locationKey="HOMEPAGE_TOP" className="mx-auto max-w-4xl" />
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h2 className="mb-3 text-3xl font-bold text-white md:text-4xl">
            How It Works
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Build your custom PC in three simple steps with our AI-powered tool
          </p>
        </div>

        <div className="mx-auto max-w-5xl grid gap-6 md:grid-cols-3">
          <div className="rounded-xl bg-gradient-to-br from-white/10 to-white/5 p-6 backdrop-blur-md border border-white/10 hover:border-blue-400/50 transition group">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/20 border border-blue-500/30 group-hover:scale-110 transition">
              <Settings className="h-7 w-7 text-blue-400" />
            </div>
            <div className="mb-2 inline-block rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-400">
              STEP 1
            </div>
            <h3 className="mb-2 text-xl font-bold text-white">Configure</h3>
            <p className="text-sm text-gray-400">
              Select your use case and set your budget. Our AI will understand your needs.
            </p>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-white/10 to-white/5 p-6 backdrop-blur-md border border-white/10 hover:border-purple-400/50 transition group">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-purple-500/20 border border-purple-500/30 group-hover:scale-110 transition">
              <Sparkles className="h-7 w-7 text-purple-400" />
            </div>
            <div className="mb-2 inline-block rounded-full bg-purple-500/20 px-3 py-1 text-xs font-semibold text-purple-400">
              STEP 2
            </div>
            <h3 className="mb-2 text-xl font-bold text-white">Generate</h3>
            <p className="text-sm text-gray-400">
              AI analyzes thousands of components and creates the perfect build for you.
            </p>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-white/10 to-white/5 p-6 backdrop-blur-md border border-white/10 hover:border-green-400/50 transition group">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-500/20 border border-green-500/30 group-hover:scale-110 transition">
              <Package className="h-7 w-7 text-green-400" />
            </div>
            <div className="mb-2 inline-block rounded-full bg-green-500/20 px-3 py-1 text-xs font-semibold text-green-400">
              STEP 3
            </div>
            <h3 className="mb-2 text-xl font-bold text-white">Order</h3>
            <p className="text-sm text-gray-400">
              Get direct Amazon links for all components. Order with confidence.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive PC Visualization */}
      {interactiveParts && (
        <section className="container mx-auto px-4 py-12">
          <div className="text-center mb-10">
            <h2 className="mb-3 text-3xl font-bold text-white md:text-4xl">
              Visualize Your Build
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              See exactly how components fit together in an interactive diagram
            </p>
          </div>
          <InteractivePCView parts={interactiveParts} />
        </section>
      )}

      {/* Key Features */}
      <section className="container mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h2 className="mb-3 text-3xl font-bold text-white md:text-4xl">
            Why Choose Our PC Builder?
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Powerful features to help you build the perfect PC
          </p>
        </div>

        <div className="mx-auto max-w-6xl grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-gradient-to-br from-white/10 to-white/5 p-6 backdrop-blur-md border border-white/10 hover:border-blue-400/50 transition">
            <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/20 border border-blue-500/30">
              <Sparkles className="h-6 w-6 text-blue-400" />
            </div>
            <h3 className="mb-2 font-semibold text-white">AI Optimized</h3>
            <p className="text-sm text-gray-400">
              Intelligent component selection for maximum performance
            </p>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-white/10 to-white/5 p-6 backdrop-blur-md border border-white/10 hover:border-green-400/50 transition">
            <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20 border border-green-500/30">
              <Shield className="h-6 w-6 text-green-400" />
            </div>
            <h3 className="mb-2 font-semibold text-white">100% Compatible</h3>
            <p className="text-sm text-gray-400">
              All parts verified for perfect compatibility
            </p>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-white/10 to-white/5 p-6 backdrop-blur-md border border-white/10 hover:border-yellow-400/50 transition">
            <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/20 border border-yellow-500/30">
              <Clock className="h-6 w-6 text-yellow-400" />
            </div>
            <h3 className="mb-2 font-semibold text-white">Instant Results</h3>
            <p className="text-sm text-gray-400">
              Get your build in seconds with live pricing
            </p>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-white/10 to-white/5 p-6 backdrop-blur-md border border-white/10 hover:border-purple-400/50 transition">
            <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/20 border border-purple-500/30">
              <Award className="h-6 w-6 text-purple-400" />
            </div>
            <h3 className="mb-2 font-semibold text-white">Best Value</h3>
            <p className="text-sm text-gray-400">
              Optimized for performance within your budget
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-6xl rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-8 backdrop-blur-md border border-white/20">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/20">
                <CheckCircle2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">Save Time</h4>
                <p className="text-sm text-gray-300">
                  No need to research hundreds of components. AI does it for you.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/20">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">Best Performance</h4>
                <p className="text-sm text-gray-300">
                  Optimized builds for your specific use case and budget.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/20">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">Trusted by Thousands</h4>
                <p className="text-sm text-gray-300">
                  Join our community of satisfied PC builders.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Builds */}
      <section className="container mx-auto px-4 py-12">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h2 className="mb-3 text-3xl font-bold text-white md:text-4xl">Featured Builds</h2>
            <p className="text-gray-400 max-w-2xl">
              Explore our curated collection of top-rated PC configurations
            </p>
          </div>
          <button
            onClick={() => navigate({ to: "/builds" })}
            className="hidden sm:flex items-center gap-2 rounded-lg bg-blue-500/20 px-6 py-3 font-medium text-blue-300 backdrop-blur-sm transition hover:bg-blue-500/30 border border-blue-500/30"
          >
            Browse All Builds
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {featuredBuildsQuery.isLoading && (
          <div className="flex justify-center py-12">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500/30 border-t-blue-500"></div>
          </div>
        )}

        {featuredBuildsQuery.data && (
          <>
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {featuredBuildsQuery.data.map((build) => {
                const parts = build.parts as Array<{
                  category: string;
                  name: string;
                  price: number;
                }>;
                const cpuPart = parts.find((p) => p.category === "CPU");
                const gpuPart = parts.find((p) => p.category === "GPU");

                return (
                  <div
                    key={build.id}
                    className="group cursor-pointer overflow-hidden rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur-md transition hover:bg-white/15 border border-white/10 hover:border-blue-400/50 hover:scale-[1.02]"
                    onClick={() => navigate({ to: `/build/${build.id}` })}
                  >
                    <div className="relative h-32 sm:h-40 lg:h-48 overflow-hidden bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Cpu className="h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 text-white/20" />
                      </div>
                      <div className="absolute right-3 sm:right-4 top-3 sm:top-4 rounded-full bg-black/50 px-2.5 sm:px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                        {build.category}
                      </div>
                    </div>
                    
                    <div className="p-4 sm:p-5 lg:p-6">
                      <div className="mb-3 sm:mb-4 flex items-center justify-between gap-2">
                        <span className="text-xl sm:text-2xl font-bold text-white">
                          {formatPrice(build.totalCost)}
                        </span>
                        <div className="flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-1 text-xs font-medium text-green-400 border border-green-500/30">
                          <Shield className="h-3 w-3" />
                          {build.compatibility.toFixed(1)}%
                        </div>
                      </div>

                      <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm mb-3 sm:mb-4">
                        {cpuPart && (
                          <div className="flex items-start gap-2">
                            <span className="text-gray-400 whitespace-nowrap">CPU:</span>
                            <span className="flex-1 text-gray-300 line-clamp-1">{cpuPart.name}</span>
                          </div>
                        )}
                        {gpuPart && (
                          <div className="flex items-start gap-2">
                            <span className="text-gray-400 whitespace-nowrap">GPU:</span>
                            <span className="flex-1 text-gray-300 line-clamp-1">{gpuPart.name}</span>
                          </div>
                        )}
                      </div>

                      <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-500/20 px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-blue-300 transition group-hover:bg-blue-500/30 border border-blue-500/30">
                        View Build
                        <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 transition group-hover:translate-x-1" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Browse All Builds Button - Mobile */}
            <div className="mt-8 flex justify-center sm:hidden">
              <button
                onClick={() => navigate({ to: "/builds" })}
                className="flex items-center gap-2 rounded-lg bg-blue-500/20 px-6 py-3 font-medium text-blue-300 backdrop-blur-sm transition hover:bg-blue-500/30 border border-blue-500/30"
              >
                Browse All Builds
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </>
        )}
      </section>

      {/* Latest Blog Posts */}
      <section className="container mx-auto px-4 py-12">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h2 className="mb-3 text-3xl font-bold text-white md:text-4xl">Latest Blog Posts</h2>
            <p className="text-gray-400 max-w-2xl">
              Expert guides, reviews, and insights on PC building
            </p>
          </div>
          <button
            onClick={() => navigate({ to: "/blogs" })}
            className="hidden sm:flex items-center gap-2 rounded-lg bg-purple-500/20 px-6 py-3 font-medium text-purple-300 backdrop-blur-sm transition hover:bg-purple-500/30 border border-purple-500/30"
          >
            View All Posts
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {blogPostsQuery.isLoading && (
          <div className="flex justify-center py-12">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-500/30 border-t-purple-500"></div>
          </div>
        )}

        {blogPostsQuery.data && blogPostsQuery.data.length > 0 && (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {blogPostsQuery.data.map((post) => (
                <BlogCard
                  key={post.id}
                  slug={post.slug}
                  title={post.title}
                  metaDescription={post.metaDescription}
                  category={post.category}
                  readingTime={post.readingTime}
                  featuredImage={post.featuredImage}
                  publishedAt={post.publishedAt}
                />
              ))}
            </div>

            {/* View All Posts Button - Mobile */}
            <div className="mt-8 flex justify-center sm:hidden">
              <button
                onClick={() => navigate({ to: "/blogs" })}
                className="flex items-center gap-2 rounded-lg bg-purple-500/20 px-6 py-3 font-medium text-purple-300 backdrop-blur-sm transition hover:bg-purple-500/30 border border-purple-500/30"
              >
                View All Posts
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </>
        )}

        {blogPostsQuery.data && blogPostsQuery.data.length === 0 && (
          <div className="rounded-2xl bg-white/10 p-12 text-center backdrop-blur-md">
            <p className="text-gray-400">No blog posts available yet. Check back soon!</p>
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-4xl rounded-2xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 p-8 md:p-12 backdrop-blur-md border border-white/20 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
            Ready to Build Your PC?
          </h2>
          <p className="mb-6 text-lg text-gray-300">
            Start building your dream PC today with our AI-powered tool
          </p>
          <button
            onClick={() => navigate({ to: "/build" })}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-blue-500/50 transition hover:shadow-xl hover:shadow-blue-500/60 hover:scale-105"
          >
            <Wrench className="h-5 w-5" />
            Start Building Now
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-gray-400">
            <p>&copy; 2024 pcforgeai. Powered by AI.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
