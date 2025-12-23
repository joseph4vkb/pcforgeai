import { Cpu, HardDrive, Zap, Fan, Box, Monitor } from "lucide-react";

interface Part {
  category: string;
  name: string;
  asin: string;
  price: number;
  specs: Record<string, any>;
}

interface InteractivePCViewProps {
  parts: Part[];
}

export function InteractivePCView({ parts }: InteractivePCViewProps) {
  const getPartByCategory = (category: string) => {
    return parts.find((p) => p.category === category);
  };

  const cpu = getPartByCategory("CPU");
  const motherboard = getPartByCategory("Motherboard");
  const ram = getPartByCategory("RAM");
  const gpu = getPartByCategory("GPU");
  const ssd = getPartByCategory("SSD");
  const psu = getPartByCategory("PSU");
  const pcCase = getPartByCategory("Case");
  const cooler = getPartByCategory("Cooler");

  const ComponentLabel = ({
    icon: Icon,
    name,
    position,
    color,
  }: {
    icon: any;
    name: string;
    position: string;
    color: string;
  }) => (
    <div
      className={`absolute ${position} group cursor-pointer transition-transform hover:scale-110`}
    >
      <div
        className={`flex items-center gap-2 rounded-lg ${color} px-3 py-2 text-sm font-medium backdrop-blur-sm border shadow-lg`}
      >
        <Icon className="h-4 w-4" />
        <span className="hidden group-hover:inline">{name}</span>
      </div>
      <div className="absolute left-1/2 top-full mt-2 hidden -translate-x-1/2 group-hover:block">
        <div className="rounded-lg bg-black/90 px-3 py-2 text-xs text-white backdrop-blur-sm max-w-xs">
          {name}
        </div>
      </div>
    </div>
  );

  return (
    <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 p-8 shadow-2xl backdrop-blur-md border border-white/20">
      <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
        <Box className="h-8 w-8 text-blue-400" />
        Interactive PC Component Layout
      </h2>
      <p className="text-gray-400 mb-8">
        Hover over components to see their names. This diagram shows where each part is located in your PC build.
      </p>

      {/* PC Case Diagram */}
      <div className="relative mx-auto max-w-4xl">
        {/* Main PC Case SVG */}
        <svg
          viewBox="0 0 800 600"
          className="w-full h-auto"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Case outline */}
          <rect
            x="50"
            y="50"
            width="700"
            height="500"
            rx="20"
            fill="rgba(30, 41, 59, 0.5)"
            stroke="rgba(59, 130, 246, 0.5)"
            strokeWidth="3"
          />

          {/* Front panel */}
          <rect
            x="70"
            y="70"
            width="30"
            height="460"
            rx="5"
            fill="rgba(51, 65, 85, 0.7)"
            stroke="rgba(100, 116, 139, 0.5)"
            strokeWidth="2"
          />

          {/* Motherboard area */}
          <rect
            x="120"
            y="80"
            width="400"
            height="450"
            rx="10"
            fill="rgba(15, 23, 42, 0.6)"
            stroke="rgba(34, 197, 94, 0.4)"
            strokeWidth="2"
          />

          {/* CPU socket area */}
          <circle
            cx="320"
            cy="200"
            r="60"
            fill="rgba(59, 130, 246, 0.3)"
            stroke="rgba(59, 130, 246, 0.6)"
            strokeWidth="2"
          />

          {/* CPU cooler */}
          <rect
            x="270"
            y="150"
            width="100"
            height="100"
            rx="10"
            fill="rgba(148, 163, 184, 0.4)"
            stroke="rgba(148, 163, 184, 0.6)"
            strokeWidth="2"
          />

          {/* RAM slots */}
          <rect
            x="150"
            y="300"
            width="30"
            height="120"
            rx="5"
            fill="rgba(34, 197, 94, 0.3)"
            stroke="rgba(34, 197, 94, 0.6)"
            strokeWidth="2"
          />
          <rect
            x="190"
            y="300"
            width="30"
            height="120"
            rx="5"
            fill="rgba(34, 197, 94, 0.3)"
            stroke="rgba(34, 197, 94, 0.6)"
            strokeWidth="2"
          />

          {/* PCIe slots / GPU area */}
          <rect
            x="140"
            y="450"
            width="350"
            height="60"
            rx="5"
            fill="rgba(168, 85, 247, 0.3)"
            stroke="rgba(168, 85, 247, 0.6)"
            strokeWidth="2"
          />

          {/* Storage bays */}
          <rect
            x="550"
            y="100"
            width="180"
            height="80"
            rx="5"
            fill="rgba(234, 179, 8, 0.3)"
            stroke="rgba(234, 179, 8, 0.6)"
            strokeWidth="2"
          />
          <rect
            x="550"
            y="200"
            width="180"
            height="80"
            rx="5"
            fill="rgba(234, 179, 8, 0.3)"
            stroke="rgba(234, 179, 8, 0.6)"
            strokeWidth="2"
          />

          {/* PSU area */}
          <rect
            x="550"
            y="400"
            width="180"
            height="120"
            rx="5"
            fill="rgba(239, 68, 68, 0.3)"
            stroke="rgba(239, 68, 68, 0.6)"
            strokeWidth="2"
          />

          {/* Decorative elements */}
          <circle cx="640" cy="460" r="20" fill="rgba(148, 163, 184, 0.3)" />
          <circle cx="640" cy="460" r="15" fill="rgba(59, 130, 246, 0.2)" />
        </svg>

        {/* Component Labels */}
        {cpu && (
          <ComponentLabel
            icon={Cpu}
            name={cpu.name}
            position="top-[25%] left-[35%]"
            color="bg-blue-500/20 border-blue-500/30 text-blue-300"
          />
        )}

        {cooler && (
          <ComponentLabel
            icon={Fan}
            name={cooler.name}
            position="top-[22%] left-[30%]"
            color="bg-gray-500/20 border-gray-500/30 text-gray-300"
          />
        )}

        {ram && (
          <ComponentLabel
            icon={Monitor}
            name={ram.name}
            position="top-[50%] left-[18%]"
            color="bg-green-500/20 border-green-500/30 text-green-300"
          />
        )}

        {gpu && (
          <ComponentLabel
            icon={Cpu}
            name={gpu.name}
            position="top-[78%] left-[35%]"
            color="bg-purple-500/20 border-purple-500/30 text-purple-300"
          />
        )}

        {ssd && (
          <ComponentLabel
            icon={HardDrive}
            name={ssd.name}
            position="top-[20%] right-[15%]"
            color="bg-yellow-500/20 border-yellow-500/30 text-yellow-300"
          />
        )}

        {psu && (
          <ComponentLabel
            icon={Zap}
            name={psu.name}
            position="bottom-[15%] right-[15%]"
            color="bg-red-500/20 border-red-500/30 text-red-300"
          />
        )}

        {pcCase && (
          <ComponentLabel
            icon={Box}
            name={pcCase.name}
            position="top-[10%] left-[8%]"
            color="bg-slate-500/20 border-slate-500/30 text-slate-300"
          />
        )}

        {motherboard && (
          <ComponentLabel
            icon={Monitor}
            name={motherboard.name}
            position="top-[45%] left-[28%]"
            color="bg-teal-500/20 border-teal-500/30 text-teal-300"
          />
        )}
      </div>

      {/* Legend */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex items-center gap-2 text-sm">
          <div className="h-4 w-4 rounded bg-blue-500/40 border border-blue-500/60"></div>
          <span className="text-gray-300">CPU & Cooler</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="h-4 w-4 rounded bg-green-500/40 border border-green-500/60"></div>
          <span className="text-gray-300">RAM</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="h-4 w-4 rounded bg-purple-500/40 border border-purple-500/60"></div>
          <span className="text-gray-300">GPU</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="h-4 w-4 rounded bg-yellow-500/40 border border-yellow-500/60"></div>
          <span className="text-gray-300">Storage</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="h-4 w-4 rounded bg-red-500/40 border border-red-500/60"></div>
          <span className="text-gray-300">PSU</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="h-4 w-4 rounded bg-slate-500/40 border border-slate-500/60"></div>
          <span className="text-gray-300">Case</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="h-4 w-4 rounded bg-teal-500/40 border border-teal-500/60"></div>
          <span className="text-gray-300">Motherboard</span>
        </div>
      </div>
    </div>
  );
}
