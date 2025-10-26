import { NextRequest, NextResponse } from "next/server";

/**
 * ERC1155 Metadata API Route
 * Returns JSON metadata for MinecraftItems NFTs
 * Spec: https://eips.ethereum.org/EIPS/eip-1155#metadata
 */

interface ItemMetadata {
  name: string;
  description: string;
  image: string;
}

// Metadata for each token ID
const ITEM_METADATA: Record<number, ItemMetadata> = {
  1: {
    name: "Wooden Log",
    description: "A sturdy oak log harvested from trees. Can be crafted into 4 wooden planks.",
    image: "/items/oak_log.png",
  },
  2: {
    name: "Wooden Plank",
    description: "Wooden planks made from oak logs. Essential crafting material for tools and sticks.",
    image: "/items/oak_planks.png",
  },
  3: {
    name: "Stick",
    description: "A simple wooden stick crafted from 2 planks. Yields 4 sticks. Used as a handle for tools.",
    image: "/items/stick.png",
  },
  4: {
    name: "Wooden Pickaxe",
    description: "A basic wooden pickaxe for mining. Crafted from 3 planks and 2 sticks.",
    image: "/items/stick.png", // Using stick as placeholder - wooden_pickaxe.png doesn't exist
  },
  5: {
    name: "Diamond",
    description: "A precious diamond. Rare and valuable, used for crafting advanced tools and weapons.",
    image: "/items/diamond.png",
  },
  6: {
    name: "Diamond Pickaxe",
    description: "A powerful diamond pickaxe. Crafted from 3 diamonds and 2 sticks. Perfect for mining rare ores.",
    image: "/items/diamond_pickaxe.png",
  },
  7: {
    name: "Diamond Sword",
    description: "A sharp diamond sword. Crafted from 2 diamonds and 1 stick. A formidable weapon.",
    image: "/items/diamond_sword.png",
  },
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tokenId = parseInt(id, 10);

  // Validate token ID
  if (isNaN(tokenId) || !ITEM_METADATA[tokenId]) {
    return NextResponse.json(
      {
        error: "Invalid token ID",
        message: `Token ID ${id} does not exist. Valid IDs are 1-7.`,
      },
      { status: 404 },
    );
  }

  const metadata = ITEM_METADATA[tokenId];

  // Get base URL for absolute image paths
  const protocol = request.headers.get("x-forwarded-proto") || "http";
  const host = request.headers.get("host") || "localhost:3000";
  const baseUrl = `${protocol}://${host}`;

  // Return ERC1155 compliant metadata
  return NextResponse.json(
    {
      name: metadata.name,
      description: metadata.description,
      image: `${baseUrl}${metadata.image}`,
    },
    {
      headers: {
        "Content-Type": "application/json",
        // Cache for 1 hour (metadata is static)
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}
