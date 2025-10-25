"use client";

import React from "react";
import { useCraftingStore } from "../../services/store/inventoryStore";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";

export const TransactionStatus: React.FC = () => {
  const { txStatus, txHash, errorMessage } = useCraftingStore();
  const { targetNetwork } = useTargetNetwork();

  if (txStatus === "idle") {
    return null;
  }

  const getBlockExplorerUrl = (hash: string) => {
    const baseUrl = targetNetwork.blockExplorers?.default?.url || "";
    return `${baseUrl}/tx/${hash}`;
  };

  return (
    <div className="fixed right-4 bottom-4 z-50 max-w-md">
      {/* Pending State */}
      {txStatus === "pending" && (
        <div className="rounded-sm border-2 border-neutral-700 bg-neutral-800/90 p-3 text-neutral-200 shadow-[4px_4px_0_rgba(0,0,0,0.6)]">
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-transparent"></div>
            <div>
              <h3 className="font-mono text-sm tracking-wide text-neutral-200 uppercase">Crafting...</h3>
              <div className="text-xs text-neutral-300">Please wait while your transaction is being processed</div>
            </div>
          </div>
        </div>
      )}

      {/* Success State */}
      {txStatus === "success" && (
        <div className="rounded-sm border-2 border-neutral-700 bg-neutral-800/90 p-3 text-neutral-200 shadow-[4px_4px_0_rgba(0,0,0,0.6)]">
          <div className="flex items-center gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 flex-shrink-0 text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h3 className="font-mono text-sm tracking-wide text-emerald-300 uppercase">Crafting Successful</h3>
              <div className="text-xs text-neutral-300">
                Your items have been crafted
                {txHash && (
                  <>
                    {" "}
                    -{" "}
                    <a
                      href={getBlockExplorerUrl(txHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-300 underline hover:text-emerald-200"
                    >
                      View Transaction
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {txStatus === "error" && (
        <div className="rounded-sm border-2 border-neutral-700 bg-neutral-800/90 p-3 text-neutral-200 shadow-[4px_4px_0_rgba(0,0,0,0.6)]">
          <div className="flex items-center gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 flex-shrink-0 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h3 className="font-mono text-sm tracking-wide text-red-300 uppercase">Transaction Failed</h3>
              <div className="text-xs text-neutral-300">{errorMessage || "Please try again"}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
