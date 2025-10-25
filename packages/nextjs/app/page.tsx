"use client";

import { CraftingInterface } from "../components/crafting";

const Page: React.FC = () => {
  return (
    <div
      style={{
        background: "url(/textures/stone.png)",
        backgroundPosition: "center",
        backgroundSize: 48,
      }}
      className="min-h-screen"
    >
      <CraftingInterface />
    </div>
  );
};

export default Page;
