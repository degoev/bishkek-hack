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
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      {/* Pending State */}
      {txStatus === "pending" && (
        <div className="alert bg-blue-600 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            <div>
              <h3 className="font-bold">Crafting...</h3>
              <div className="text-sm">Please wait while your transaction is being processed</div>
            </div>
          </div>
        </div>
      )}

      {/* Success State */}
      {txStatus === "success" && (
        <div className="alert bg-green-600 text-white shadow-lg">
          <div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 flex-shrink-0 stroke-current"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h3 className="font-bold">Crafting Successful!</h3>
              <div className="text-sm">
                Your items have been crafted
                {txHash && (
                  <>
                    {" "}
                    -{" "}
                    <a
                      href={getBlockExplorerUrl(txHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-green-200"
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
        <div className="alert bg-red-600 text-white shadow-lg">
          <div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 flex-shrink-0 stroke-current"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h3 className="font-bold">Transaction Failed</h3>
              <div className="text-sm">{errorMessage || "Please try again"}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
