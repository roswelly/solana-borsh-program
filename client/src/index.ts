import "dotenv/config";
import BN from "bn.js";
import bs58 from "bs58";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  clusterApiUrl,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
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
  serializeInstruction,
} from "./schema.js";

const PROGRAM_ID = new PublicKey(requireEnv(["PROGRAM_ID"]));

function requireEnv(names: string[]): string {
  for (const name of names) {
    const value = process.env[name];
    if (value) {
      return value;
    }
  }
  throw new Error(`Missing env var ${names.join(" or ")}`);
}

function parseSecretKey(value: string): Uint8Array {
  const trimmed = value.trim();
  if (trimmed.startsWith("[")) {
    const secret = JSON.parse(trimmed) as number[];
    return Uint8Array.from(secret);
  }
  if (trimmed.includes(",")) {
    const secret = JSON.parse(`[${trimmed}]`) as number[];
    return Uint8Array.from(secret);
  }
  return bs58.decode(trimmed);
}

function loadKeypairFromEnv(names: string[]): Keypair {
  const secret = parseSecretKey(requireEnv(names));
  return Keypair.fromSecretKey(secret);
}

function buildState(sampleAuthority: PublicKey): BorshDemoState {
  return new BorshDemoState({
    primitive_u8: 42,
    primitive_u16: 500,
    primitive_u32: 99_999,
    primitive_u64: new BN(123456789),
    primitive_i64: new I64(new BN(-123456)),
    primitive_bool: new Bool(true),
    fixed_pubkey_bytes: sampleAuthority.toBytes(),
    text: "hello borsh",
    data: new Uint8Array([1, 2, 3, 4]),
    keys: [new PubkeyBytes(sampleAuthority.toBytes())],
    simple_enum: new SimpleEnum("Second"),
    data_enum: new DataEnum("Amount", { value: new BN(42) }),
    maybe_amount: new BN(999),
    nested: new NestedStruct({ count: 7, note: "nested" }),
  });
}

async function main(): Promise<void> {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  const payer = loadKeypairFromEnv([
    "PAYER_PRIVATE_KEY",
    "PAYER_SECRET_KEY",
  ]);
  const stateKeypair = Keypair.generate();

  const state = buildState(payer.publicKey);
  const initInstruction = new BorshDemoInstruction({
    Initialize: { data: state },
  });

  const instructionData = serializeInstruction(initInstruction);
  const initIx = new TransactionInstruction({
    programId: PROGRAM_ID,
    data: Buffer.from(instructionData),
    keys: [
      { pubkey: payer.publicKey, isSigner: true, isWritable: true },
      { pubkey: stateKeypair.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
  });

  const initTx = new Transaction().add(initIx);
  const initSig = await sendAndConfirmTransaction(connection, initTx, [
    payer,
    stateKeypair,
  ]);
  console.log("Initialize tx:", initSig);

  const updateInstruction = new BorshDemoInstruction({
    Update: {
      new_u64: new BN(555),
      new_bool: new Bool(false),
      new_text: "hello borsh",
      new_option: new BN(777),
    },
  });
  const updateIx = new TransactionInstruction({
    programId: PROGRAM_ID,
    data: Buffer.from(serializeInstruction(updateInstruction)),
    keys: [{ pubkey: stateKeypair.publicKey, isSigner: false, isWritable: true }],
  });

  const updateTx = new Transaction().add(updateIx);
  const updateSig = await sendAndConfirmTransaction(connection, updateTx, [payer]);
  console.log("Update tx:", updateSig);

  const validateInstruction = new BorshDemoInstruction({
    Validate: { expected_u8: 42 },
  });
  const validateIx = new TransactionInstruction({
    programId: PROGRAM_ID,
    data: Buffer.from(serializeInstruction(validateInstruction)),
    keys: [{ pubkey: stateKeypair.publicKey, isSigner: false, isWritable: false }],
  });
  const validateTx = new Transaction().add(validateIx);
  const validateSig = await sendAndConfirmTransaction(connection, validateTx, [payer]);
  console.log("Validate tx:", validateSig);

  const accountInfo = await connection.getAccountInfo(stateKeypair.publicKey);
  if (!accountInfo) {
    throw new Error("State account not found");
  }

  const decoded = deserializeAccount(accountInfo.data);
  console.log("Decoded account primitive_u64:", decoded.data.primitive_u64.toString());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
