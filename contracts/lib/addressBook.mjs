import fs from "node:fs";
import path from "node:path";
import { isAddress } from "viem";

const EMPTY_ADDRESS_BOOK = {
  ngnTokenAddress: "",
  cnyTokenAddress: "",
};

function normalizeAddress(value) {
  if (!value || typeof value !== "string") return "";
  return isAddress(value) ? value : "";
}

export function addressBookPath(projectRoot) {
  return path.join(projectRoot, "contracts", "address.json");
}

export function readAddressBook(projectRoot) {
  const filePath = addressBookPath(projectRoot);
  if (!fs.existsSync(filePath)) return { ...EMPTY_ADDRESS_BOOK };

  const fileContents = fs.readFileSync(filePath, "utf8");
  const parsed = JSON.parse(fileContents);

  return {
    ngnTokenAddress: normalizeAddress(parsed.ngnTokenAddress),
    cnyTokenAddress: normalizeAddress(parsed.cnyTokenAddress),
  };
}

export function writeAddressBook(projectRoot, addresses) {
  const filePath = addressBookPath(projectRoot);
  const normalized = {
    ngnTokenAddress: normalizeAddress(addresses.ngnTokenAddress),
    cnyTokenAddress: normalizeAddress(addresses.cnyTokenAddress),
  };

  fs.writeFileSync(filePath, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
}
