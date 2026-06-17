import CanvasStage from "@/components/CanvasStage";

import ControlPanel from "@/components/ControlPanel";

export default function Home() {
  return (
    <main className = 'relative w-screen h-screen overflow-hidden bg-black'>
      {/* 1. The visual Physics engine */}
      <CanvasStage />

      {/* 2. The instruments panel */}
      <ControlPanel />

      {/* 3. a vignette to make it look better */}
      <div className = "pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]" />

    </main>
  );
}