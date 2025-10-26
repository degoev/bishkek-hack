import { createPublicClient, webSocket } from "viem";
import deployedContractsData from "~~/contracts/deployedContracts";
import scaffoldConfig from "~~/scaffold.config";
import { increaseItemBalanceAction } from "~~/services/backend/actions";
import { ItemUid, TOKEN_ID_TO_ITEM } from "~~/services/web3/itemConfig";

export const runtime = "nodejs";
// This is required to enable streaming
export const dynamic = "force-dynamic";

const WS_RPC_URL = process.env.WS_RPC_URL || "ws://127.0.0.1:8545/";

const chain = scaffoldConfig.targetNetworks[0];
const contract = deployedContractsData[chain.id]["MinecraftItems"];
const client = createPublicClient({
  chain,
  transport: webSocket(WS_RPC_URL),
});

const responseStream = new TransformStream();
const writer = responseStream.writable.getWriter();
const encoder = new TextEncoder();
console.log(`Setuping stream...`);

client.watchContractEvent({
  abi: contract.abi,
  address: contract.address,
  eventName: "ItemsBridged",

  onLogs: async logs => {
    for (const log of logs) {
      const str = JSON.stringify(log, (_, value) => (typeof value === "bigint" ? String(value) : value), 2);
      console.info(`🚀 ~ "Log": ${str}`);
      if (!writer.closed) {
        writer.write(encoder.encode(`Log: ${str}\n`));
      }
      if (!log.args) {
        console.error("Log has no args");
        continue;
      }
      const { user, tokenIds = [], amounts = [] } = log.args;
      if (!user) {
        console.error("Log has no user");
        continue;
      }

      const itemUids: ItemUid[] = Array.from(
        new Set(
          tokenIds
            .map(
              id =>
                // @ts-expect-error TokenId is compatible with BigInt
                TOKEN_ID_TO_ITEM[Number(id)],
            )
            .filter(Boolean),
        ),
      );
      const amountsNum: number[] = amounts.map(amount => Number(amount));

      if (itemUids.length !== amountsNum.length) {
        console.error("Mismatched itemUids and amounts lengths");
        continue;
      }
      for (let i = 0; i < itemUids.length; i++) {
        const item = itemUids[i];
        const amount = amountsNum[i];
        const logStr = `Bridged ${amount} of item ${item} to user ${user}`;
        console.info(`🚀 ~ "${logStr}"`);

        increaseItemBalanceAction(user as `0x${string}`, item, amount).catch(err => {
          console.error(`Failed to increase balance for user ${user}, item ${item}:`, err);
        });
      }
    }
  },
});

export async function GET() {
  writer.write(encoder.encode("Waiting for logs..."));
  console.info(`🚀 ~ "Waiting for logs...":`);

  return new Response(responseStream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      Connection: "keep-alive",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
