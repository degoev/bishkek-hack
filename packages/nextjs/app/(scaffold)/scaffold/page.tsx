"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { BugAntIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-eth";

export default (() => {
  const { address: connectedAddress } = useAccount();

  return (
    <div className="flex grow flex-col items-center pt-10">
      <div className="px-5">
        <h1 className="text-center">
          <span className="mb-2 block text-2xl">Welcome to</span>
          <span className="block text-4xl font-bold">Scaffold-ETH 2</span>
        </h1>
        <div className="flex flex-col items-center justify-center space-x-2">
          <p className="my-2 font-medium">Connected Address:</p>
          <Address address={connectedAddress} />
        </div>

        <p className="text-center text-lg">
          Get started by editing{" "}
          <code className="bg-base-300 inline-block max-w-full text-base font-bold break-words break-all italic">
            packages/nextjs/app/page.tsx
          </code>
        </p>
        <p className="text-center text-lg">
          Edit your smart contract{" "}
          <code className="bg-base-300 inline-block max-w-full text-base font-bold break-words break-all italic">
            YourContract.sol
          </code>{" "}
          in{" "}
          <code className="bg-base-300 inline-block max-w-full text-base font-bold break-words break-all italic">
            packages/hardhat/contracts
          </code>
        </p>
      </div>

      <div className="bg-base-300 mt-16 w-full grow px-8 py-12">
        <div className="flex flex-col items-center justify-center gap-12 md:flex-row">
          <div className="bg-base-100 flex max-w-xs flex-col items-center rounded-3xl px-10 py-10 text-center">
            <BugAntIcon className="fill-secondary h-8 w-8" />
            <p>
              Tinker with your smart contract using the{" "}
              <Link href="/scaffold/debug" passHref className="link">
                Debug Contracts
              </Link>{" "}
              tab.
            </p>
          </div>
          <div className="bg-base-100 flex max-w-xs flex-col items-center rounded-3xl px-10 py-10 text-center">
            <MagnifyingGlassIcon className="fill-secondary h-8 w-8" />
            <p>
              Explore your local transactions with the{" "}
              <Link href="/scaffold/scaffold/blockexplorer" passHref className="link">
                Block Explorer
              </Link>{" "}
              tab.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}) as React.FC;
