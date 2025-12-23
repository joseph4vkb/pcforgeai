import { BookOpen, Video, Download, ExternalLink } from "lucide-react";

const assemblySteps = [
  {
    step: 1,
    title: "Prepare Your Workspace",
    description:
      "Clear a large, flat surface and gather all your components. Use an anti-static mat if available and wear an anti-static wrist strap. Ensure good lighting and have a magnetic screwdriver ready.",
  },
  {
    step: 2,
    title: "Install the Power Supply (PSU)",
    description:
      "Mount the PSU in the case with the fan facing down (if your case has bottom ventilation) or towards the rear. Secure it with the four screws provided. Don't connect power cables yet.",
  },
  {
    step: 3,
    title: "Install I/O Shield",
    description:
      "Pop the I/O shield (the metal plate that came with your motherboard) into the rectangular slot at the back of your case. Press firmly until it clicks into place.",
  },
  {
    step: 4,
    title: "Install CPU on Motherboard",
    description:
      "Open the CPU socket on the motherboard by lifting the retention arm. Align the CPU with the socket (look for the golden triangle or notches). Gently place it in and lower the retention arm to secure it.",
  },
  {
    step: 5,
    title: "Install CPU Cooler",
    description:
      "Apply thermal paste (if not pre-applied) to the CPU surface - a rice grain-sized amount in the center. Mount the cooler according to its instructions, ensuring firm contact. Connect the cooler's fan cable to the CPU_FAN header on the motherboard.",
  },
  {
    step: 6,
    title: "Install RAM",
    description:
      "Open the RAM slot clips by pushing them outward. Align the notch on the RAM stick with the slot. Press down firmly until both clips snap into place. For dual-channel, use slots 2 and 4 (check your motherboard manual).",
  },
  {
    step: 7,
    title: "Mount Motherboard in Case",
    description:
      "Place standoffs in the case where they align with motherboard mounting holes. Carefully lower the motherboard into the case, aligning the I/O ports with the shield. Secure with screws, but don't overtighten.",
  },
  {
    step: 8,
    title: "Install Storage (SSD/HDD)",
    description:
      "For M.2 SSDs, insert at a 30-degree angle into the M.2 slot and secure with the screw. For 2.5\" SSDs or 3.5\" HDDs, mount in drive bays and connect SATA data and power cables.",
  },
  {
    step: 9,
    title: "Install Graphics Card (GPU)",
    description:
      "Remove the necessary PCIe slot covers from the case. Align the GPU with the top PCIe x16 slot, press down firmly until it clicks. Secure the GPU bracket to the case with screws. Connect PCIe power cables from PSU if required.",
  },
  {
    step: 10,
    title: "Connect Power Cables",
    description:
      "Connect the 24-pin ATX power cable to the motherboard. Connect the 4+4 pin or 8-pin CPU power cable near the CPU. Connect PCIe power to the GPU if needed. Connect SATA power to drives.",
  },
  {
    step: 11,
    title: "Connect Front Panel Connectors",
    description:
      "Connect the power button, reset button, power LED, and HDD LED cables from the case to the motherboard's front panel header. Refer to your motherboard manual for the correct pinout.",
  },
  {
    step: 12,
    title: "Cable Management and Final Check",
    description:
      "Route cables neatly behind the motherboard tray. Use cable ties to secure them. Double-check all connections. Ensure no cables are blocking fans. Close the case panels and connect your monitor, keyboard, and mouse.",
  },
  {
    step: 13,
    title: "First Boot and BIOS Setup",
    description:
      "Connect the power cable to the PSU and turn on the PSU switch. Press the power button on the case. Enter BIOS (usually by pressing DEL or F2). Check that all components are detected. Enable XMP/DOCP for RAM if available.",
  },
  {
    step: 14,
    title: "Install Operating System",
    description:
      "Insert your Windows installation USB or boot from a downloaded image. Follow the on-screen instructions to install your operating system. Install motherboard chipset drivers and GPU drivers after OS installation.",
  },
];

const videoTutorials = [
  {
    title: "Complete PC Building Guide 2024",
    creator: "Linus Tech Tips",
    videoId: "BL4DCEp7blY",
    description: "Comprehensive step-by-step PC building tutorial covering all components and assembly process.",
  },
  {
    title: "First Person PC Build Guide",
    creator: "JayzTwoCents",
    videoId: "v7MYOpFONCU",
    description: "First-person POV build guide showing exactly what you'll see during assembly.",
  },
  {
    title: "PC Building Tips and Tricks",
    creator: "Bitwit",
    videoId: "IhX0fOUYd8Q",
    description: "Essential tips, common mistakes to avoid, and pro techniques for building your PC.",
  },
];

export function AssemblyInstructions() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 p-8 shadow-2xl backdrop-blur-md border border-white/20">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-blue-500/20 p-3">
            <BookOpen className="h-8 w-8 text-blue-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-white mb-2">
              PC Assembly Instructions
            </h2>
            <p className="text-gray-400">
              Follow these step-by-step instructions to build your PC safely and correctly.
              Take your time and refer to your component manuals for specific details.
            </p>
          </div>
          <a
            href="/pc-assembly-manual.pdf"
            download
            className="flex items-center gap-2 rounded-lg bg-green-500/20 px-4 py-3 text-sm font-medium text-green-300 transition hover:bg-green-500/30 border border-green-500/30"
          >
            <Download className="h-5 w-5" />
            Download PDF Manual
          </a>
        </div>
      </div>

      {/* Assembly Steps */}
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-white">Step-by-Step Guide</h3>
        <div className="grid gap-4">
          {assemblySteps.map((step) => (
            <div
              key={step.step}
              className="rounded-xl bg-gradient-to-br from-white/10 to-white/5 p-6 shadow-lg backdrop-blur-md border border-white/10 transition hover:border-blue-400/50"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/20 border border-blue-500/30">
                  <span className="text-xl font-bold text-blue-400">
                    {step.step}
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-semibold text-white mb-2">
                    {step.title}
                  </h4>
                  <p className="text-gray-300 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Video Tutorials */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Video className="h-6 w-6 text-blue-400" />
          <h3 className="text-2xl font-bold text-white">Video Tutorials</h3>
        </div>
        <p className="text-gray-400">
          Watch these comprehensive video guides for visual step-by-step instructions.
        </p>
        <div className="grid gap-6 lg:grid-cols-3">
          {videoTutorials.map((video, index) => (
            <div
              key={index}
              className="rounded-xl bg-gradient-to-br from-white/10 to-white/5 overflow-hidden shadow-lg backdrop-blur-md border border-white/10"
            >
              <div className="aspect-video bg-black/50">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${video.videoId}`}
                  title={video.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                ></iframe>
              </div>
              <div className="p-4">
                <h4 className="font-semibold text-white mb-1">{video.title}</h4>
                <p className="text-sm text-blue-400 mb-2">by {video.creator}</p>
                <p className="text-sm text-gray-400 mb-3">{video.description}</p>
                <a
                  href={`https://www.youtube.com/watch?v=${video.videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition"
                >
                  Watch on YouTube
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-lg bg-blue-500/10 border border-blue-500/30 p-4">
          <p className="text-sm text-gray-300">
            <strong className="text-blue-400">Video Credits:</strong> All video content is created by their respective creators and is embedded from YouTube for educational purposes. We thank Linus Tech Tips, JayzTwoCents, and Bitwit for their excellent PC building tutorials.
          </p>
        </div>
      </div>

      {/* Safety Tips */}
      <div className="rounded-2xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 p-6 shadow-lg backdrop-blur-md border border-yellow-500/30">
        <h3 className="text-xl font-bold text-yellow-400 mb-3">
          ⚠️ Important Safety Tips
        </h3>
        <ul className="space-y-2 text-gray-300">
          <li className="flex items-start gap-2">
            <span className="text-yellow-400 mt-1">•</span>
            <span>Always work on a non-conductive surface and ground yourself to prevent static discharge</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-yellow-400 mt-1">•</span>
            <span>Never force components - if something doesn't fit easily, check alignment and orientation</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-yellow-400 mt-1">•</span>
            <span>Ensure the PSU is switched OFF and unplugged before working inside the case</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-yellow-400 mt-1">•</span>
            <span>Read all component manuals before starting - each part may have specific requirements</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-yellow-400 mt-1">•</span>
            <span>Take your time and don't rush - building a PC correctly is more important than building it quickly</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
