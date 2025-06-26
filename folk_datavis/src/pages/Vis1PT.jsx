import React from "react";
// Remove this import since we won't use it anymore
// import { ArrowDown } from "lucide-react";
import NetworkDiagram from "../components/PT_VIS/network_rootsPT";

export default function Vis1PT() {
  return (
    <div className="w-full min-h-screen bg-[#E6F2FC] px-12 py-20 flex flex-col items-center justify-center font-sans">
      {/* Título */}
      <div className="w-full max-w-6xl flex justify-between items-start mb-10">
        <h1 className="text-2xl font-medium text-black">
          Portuguese Geographical FolkData
        </h1>
        <span className="text-gray-300">Irish Musical FolkData</span>
      </div>

      {/* Conteúdo principal */}
      <div className="w-full max-w-6xl grid grid-cols-2 gap-12 items-start">
        {/* Gráfico */}
        <div className="w-full">
          <NetworkDiagram />
        </div>

        {/* Texto descritivo */}
        <div className="w-full">
          <h2 className="text-xl font-semibold text-black mb-4">
            Song variation and propagation through Portuguese territory
          </h2>
          <p className="text-gray-700 mb-4">
            Lorem ipsum dolor sit amet consectetur. Pulvinar faucibus non
            pellentesque hac nisl. Potenti vel sit neque nunc sed fames urna.
            Tristique risus volutpat viverra nibh phasellus massa magna urna.
            Non mauris enim mus egestas.
          </p>
          <p className="text-gray-700">
            Lorem ipsum dolor sit amet consectetur. Pulvinar faucibus non
            pellentesque hac nisl. Potenti vel sit neque nunc sed fames urna.
            Tristique risus volutpat viverra nibh phasellus massa magna urna.
            Non mauris enim mus egestas.
          </p>
        </div>
      </div>

      {/* Setinha para scroll */}
      <div className="mt-20">
        <span className="text-3xl animate-bounce inline-block">↓</span>
      </div>
    </div>
  );
}
