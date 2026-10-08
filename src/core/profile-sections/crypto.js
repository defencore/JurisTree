import { defineSection } from "./define.js";
import { attributionGroup } from "./attribution.js";

export function cryptoSection() {
  return defineSection(
    "cryptoRecords",
    "ui.cryptoAssets",
    "property",
    "ui.cryptoRecord",
    [
      [
        null,
        [
          ["title", "ui.label", "text"],
          [
            "kind",
            "ui.cryptoRecordKind",
            "select",
            {
              unspecified: "ui.notSpecified",
              wallet: "ui.cryptoWallet",
              holding: "ui.cryptoHolding",
              exchange: "ui.cryptoExchangeAccount",
              other: "ui.other",
            },
          ],
          ["asset", "ui.cryptoAssetName", "text"],
          ["symbol", "ui.assetSymbol", "text"],
          ["network", "ui.blockchainNetwork", "text"],
          ["address", "ui.publicWalletAddress", "text"],
          ["quantity", "ui.recordedQuantity", "number"],
        ],
      ],
      [
        "ui.cryptoDetails",
        [
          ["contractAddress", "ui.tokenContractAddress", "text"],
          ["platform", "ui.exchangePlatform", "text"],
          ["accountReference", "ui.exchangeAccountReference", "text"],
          [
            "ownership",
            "ui.recordedOwnership",
            "select",
            {
              unspecified: "ui.notSpecified",
              legal: "ui.registeredOwnership",
              beneficial: "ui.beneficialOwnership",
              nominee: "ui.nomineeOwnership",
              claimed: "ui.claimedOwnership",
              other: "ui.other",
            },
          ],
          ["holderId", "ui.accountHolderInMap", "person"],
          ["holder", "ui.accountHolderOutsideMap", "text"],
          ["value", "ui.estimatedValue", "number"],
          ["currency", "ui.currency", "text"],
          ["valuationDate", "ui.valuationDate", "date"],
          ["from", "ui.from", "period"],
          ["to", "ui.to", "period"],
          ["discoveredAt", "ui.discoveredOn", "date"],
          ["transactionReference", "ui.transactionReference", "text"],
          ["restrictions", "ui.recordedRestrictions", "textarea"],
        ],
      ],
      attributionGroup,
    ],
    [["from", "to"]],
    {
      numericMinimums: {
        quantity: 0,
        value: 0,
      },
      calendar: {
        type: "crypto",
        dates: [
          ["from", "ui.started"],
          ["to", "ui.ended"],
          ["valuationDate", "ui.valuationDate"],
          ["discoveredAt", "ui.discoveredOn"],
        ],
      },
    },
  );
}
