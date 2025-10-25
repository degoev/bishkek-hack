import { BackButton } from "./BackButton";
import { ContractTabs } from "./ContractTabs";
import { Address as AddressType } from "viem";
import { Address, Balance } from "~~/components/scaffold-eth";

export const AddressComponent = ({
  address,
  contractData,
}: {
  address: AddressType;
  contractData: { bytecode: string; assembly: string } | null;
}) => {
  return (
    <div className="m-10 mb-20">
      <div className="mb-5 flex justify-start">
        <BackButton />
      </div>
      <div className="col-span-5 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10">
        <div className="col-span-1 flex flex-col">
          <div className="bg-base-100 border-base-300 shadow-secondary mb-6 space-y-1 overflow-x-auto rounded-3xl border px-6 py-4 shadow-md lg:px-8">
            <div className="flex">
              <div className="flex flex-col gap-1">
                <Address address={address} format="long" onlyEnsOrAddress />
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold">Balance:</span>
                  <Balance address={address} className="text" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ContractTabs address={address} contractData={contractData} />
    </div>
  );
};
