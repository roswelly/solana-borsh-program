import BN from "bn.js";
import { PublicKey } from "@solana/web3.js";
import {
  BorshDemoAccount,
  BorshDemoInstruction,
  BorshDemoState,
  DataEnum,
  I64,
  Bool,
  NestedStruct,
  PubkeyBytes,
  SimpleEnum,
  deserializeAccount,
  serializeAccount,
  serializeInstruction,
} from "./schema.js";

const DISCRIMINATOR = new Uint8Array(Buffer.from("BORSHDEM"));

function toHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("hex");
}

function createZeroedState(): BorshDemoState {
  return new BorshDemoState({
    primitive_u8: 1,
    primitive_u16: 2,
    primitive_u32: 3,
    primitive_u64: new BN(4),
    primitive_i64: new I64(new BN(-5)),
    primitive_bool: new Bool(true),
    fixed_pubkey_bytes: new Uint8Array(32),
    text: "",
    data: new Uint8Array([]),
    keys: [],
    simple_enum: new SimpleEnum("First"),
    data_enum: new DataEnum("Amount", { value: new BN(0) }),
    maybe_amount: null,
    nested: new NestedStruct({ count: 0, note: "" }),
  });
}

const account = new BorshDemoAccount({
  discriminator: DISCRIMINATOR,
  data: createZeroedState(),
});

const accountBytes = serializeAccount(account);
const accountHex = toHex(accountBytes);

const expectedAccountHex = [
  "424f52534844454d",
  "01",
  "0200",
  "03000000",
  "0400000000000000",
  "fbffffffffffffff",
  "01",
  "00".repeat(32),
  "00000000",
  "00000000",
  "00000000",
  "00",
  "00",
  "0000000000000000",
  "00",
  "00000000",
  "00000000",
].join("");

console.log("Account bytes (hex):", accountHex);
console.log("Matches expected:", accountHex === expectedAccountHex);

const instruction = new BorshDemoInstruction({
  Update: {
    new_u64: new BN(5),
    new_bool: true,
    new_text: "hi",
    new_option: new BN(9),
  },
});

const instructionHex = toHex(serializeInstruction(instruction));
const expectedInstructionHex =
  "01" +
  "0500000000000000" +
  "01" +
  "02000000" +
  "6869" +
  "01" +
  "0900000000000000";

console.log("Update instruction (hex):", instructionHex);
console.log("Matches expected:", instructionHex === expectedInstructionHex);

const decoded = deserializeAccount(accountBytes);
console.log("Decoded enum tag:", decoded.data.simple_enum.enum);

const sampleKey = new PubkeyBytes(new PublicKey(new Uint8Array(32)).toBytes());
console.log("Example pubkey bytes length:", sampleKey.bytes.length);
