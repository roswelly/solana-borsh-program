import BN from "bn.js";
import { BinaryReader, BinaryWriter, deserialize, serialize } from "borsh";

export class I64 {
  value: BN;

  constructor(value: BN) {
    this.value = value;
  }

  borshSerialize(writer: BinaryWriter): void {
    const twos = this.value.toTwos(64);
    writer.writeBuffer(Buffer.from(twos.toArray("le", 8)));
  }

  static borshDeserialize(reader: BinaryReader): I64 {
    const buf = reader.readBuffer(8);
    const value = new BN(buf, "le").fromTwos(64);
    return new I64(value);
  }
}

export class Bool {
  value: boolean;

  constructor(value: boolean) {
    this.value = value;
  }

  borshSerialize(writer: BinaryWriter): void {
    writer.writeU8(this.value ? 1 : 0);
  }

  static borshDeserialize(reader: BinaryReader): Bool {
    const value = reader.readU8() !== 0;
    return new Bool(value);
  }
}

export class NestedStruct {
  count: number;
  note: string;

  constructor(fields: { count: number; note: string }) {
    this.count = fields.count;
    this.note = fields.note;
  }
}

type SimpleEnumVariant = "First" | "Second" | "Third";

export class SimpleEnumFirst {
  constructor(_: Record<string, never> = {}) {}
}

export class SimpleEnumSecond {
  constructor(_: Record<string, never> = {}) {}
}

export class SimpleEnumThird {
  constructor(_: Record<string, never> = {}) {}
}

export class SimpleEnum {
  enum: SimpleEnumVariant;
  First?: SimpleEnumFirst;
  Second?: SimpleEnumSecond;
  Third?: SimpleEnumThird;

  constructor(variant: SimpleEnumVariant | Partial<Record<SimpleEnumVariant, unknown>>) {
    if (typeof variant === "string") {
      this.enum = variant;
      this[variant] = new SimpleEnumFirst();
      if (variant === "Second") {
        this.Second = new SimpleEnumSecond();
      }
      if (variant === "Third") {
        this.Third = new SimpleEnumThird();
      }
      return;
    }
    const name = Object.keys(variant)[0] as SimpleEnumVariant;
    this.enum = name;
    if (name === "First") {
      this.First = (variant.First as SimpleEnumFirst) ?? new SimpleEnumFirst();
    } else if (name === "Second") {
      this.Second = (variant.Second as SimpleEnumSecond) ?? new SimpleEnumSecond();
    } else {
      this.Third = (variant.Third as SimpleEnumThird) ?? new SimpleEnumThird();
    }
  }
}

type DataEnumVariant = "Amount" | "Name";

export class DataEnumAmount {
  value: BN;

  constructor(fields: { value: BN }) {
    this.value = fields.value;
  }
}

export class DataEnumName {
  label: string;

  constructor(fields: { label: string }) {
    this.label = fields.label;
  }
}

export class DataEnum {
  enum: DataEnumVariant;
  Amount?: DataEnumAmount;
  Name?: DataEnumName;

  constructor(
    variant:
      | DataEnumVariant
      | Partial<Record<DataEnumVariant, { value?: BN; label?: string }>>,
    value?: { value?: BN; label?: string },
  ) {
    if (typeof variant === "string") {
      this.enum = variant;
      if (variant === "Amount") {
        this.Amount = new DataEnumAmount({ value: value?.value ?? new BN(0) });
      } else {
        this.Name = new DataEnumName({ label: value?.label ?? "" });
      }
      return;
    }
    const name = Object.keys(variant)[0] as DataEnumVariant;
    this.enum = name;
    if (name === "Amount") {
      const payload = variant.Amount ?? {};
      this.Amount =
        payload instanceof DataEnumAmount
          ? payload
          : new DataEnumAmount({ value: payload.value ?? new BN(0) });
    } else {
      const payload = variant.Name ?? {};
      this.Name =
        payload instanceof DataEnumName
          ? payload
          : new DataEnumName({ label: payload.label ?? "" });
    }
  }
}

export class PubkeyBytes {
  bytes: Uint8Array;

  constructor(bytes: Uint8Array | { bytes: Uint8Array }) {
    const resolved = bytes instanceof Uint8Array ? bytes : bytes.bytes;
    if (resolved.length !== 32) {
      throw new Error("PubkeyBytes must be 32 bytes");
    }
    this.bytes = resolved;
  }
}

export class BorshDemoState {
  primitive_u8: number;
  primitive_u16: number;
  primitive_u32: number;
  primitive_u64: BN;
  primitive_i64: I64;
  primitive_bool: Bool;
  fixed_pubkey_bytes: Uint8Array;
  text: string;
  data: Uint8Array;
  keys: PubkeyBytes[];
  simple_enum: SimpleEnum;
  data_enum: DataEnum;
  maybe_amount: BN | null;
  nested: NestedStruct;

  constructor(fields: {
    primitive_u8: number;
    primitive_u16: number;
    primitive_u32: number;
    primitive_u64: BN;
    primitive_i64: I64 | BN;
    primitive_bool: Bool | boolean;
    fixed_pubkey_bytes: Uint8Array;
    text: string;
    data: Uint8Array;
    keys: PubkeyBytes[];
    simple_enum: SimpleEnum;
    data_enum: DataEnum;
    maybe_amount: BN | null;
    nested: NestedStruct;
  }) {
    this.primitive_u8 = fields.primitive_u8;
    this.primitive_u16 = fields.primitive_u16;
    this.primitive_u32 = fields.primitive_u32;
    this.primitive_u64 = fields.primitive_u64;
    this.primitive_i64 =
      fields.primitive_i64 instanceof I64
        ? fields.primitive_i64
        : new I64(fields.primitive_i64);
    this.primitive_bool =
      fields.primitive_bool instanceof Bool
        ? fields.primitive_bool
        : new Bool(fields.primitive_bool);
    this.fixed_pubkey_bytes = fields.fixed_pubkey_bytes;
    this.text = fields.text;
    this.data = fields.data;
    this.keys = fields.keys;
    this.simple_enum = fields.simple_enum;
    this.data_enum = fields.data_enum;
    this.maybe_amount = fields.maybe_amount;
    this.nested = fields.nested;
  }
}

export class BorshDemoAccount {
  discriminator: Uint8Array;
  data: BorshDemoState;

  constructor(fields: { discriminator: Uint8Array; data: BorshDemoState }) {
    this.discriminator = fields.discriminator;
    this.data = fields.data;
  }
}

export class InitializeArgs {
  data: BorshDemoState;

  constructor(fields: { data: BorshDemoState }) {
    this.data = fields.data;
  }
}

export class UpdateArgs {
  new_u64: BN;
  new_bool: Bool;
  new_text: string;
  new_option: BN | null | undefined;

  constructor(fields: {
    new_u64: BN;
    new_bool: Bool | boolean;
    new_text: string;
    new_option: BN | null | undefined;
  }) {
    this.new_u64 = fields.new_u64;
    this.new_bool =
      fields.new_bool instanceof Bool ? fields.new_bool : new Bool(fields.new_bool);
    this.new_text = fields.new_text;
    this.new_option = fields.new_option;
  }
}

export class ValidateArgs {
  expected_u8: number;

  constructor(fields: { expected_u8: number }) {
    this.expected_u8 = fields.expected_u8;
  }
}

type InstructionVariant = "Initialize" | "Update" | "Validate";

export class BorshDemoInstruction {
  enum: InstructionVariant;
  Initialize?: InitializeArgs;
  Update?: UpdateArgs;
  Validate?: ValidateArgs;

  constructor(variant: Partial<Record<InstructionVariant, unknown>>) {
    const name = Object.keys(variant)[0] as InstructionVariant;
    this.enum = name;
    if (name === "Initialize") {
      const payload = variant.Initialize as InitializeArgs | { data: BorshDemoState };
      this.Initialize =
        payload instanceof InitializeArgs ? payload : new InitializeArgs(payload);
      return;
    }
    if (name === "Update") {
      const payload = variant.Update as UpdateArgs | {
        new_u64: BN;
        new_bool: boolean;
        new_text: string;
        new_option: BN | null | undefined;
      };
      this.Update =
        payload instanceof UpdateArgs ? payload : new UpdateArgs(payload);
      return;
    }
    const payload = variant.Validate as ValidateArgs | { expected_u8: number };
    this.Validate =
      payload instanceof ValidateArgs ? payload : new ValidateArgs(payload);
  }
}

export const BorshSchema = new Map<unknown, unknown>([
  [
    NestedStruct,
    {
      kind: "struct",
      fields: [
        ["count", "u32"],
        ["note", "string"],
      ],
    },
  ],
  [
    SimpleEnum,
    {
      kind: "enum",
      field: "enum",
      values: [
        ["First", SimpleEnumFirst],
        ["Second", SimpleEnumSecond],
        ["Third", SimpleEnumThird],
      ],
    },
  ],
  [
    SimpleEnumFirst,
    {
      kind: "struct",
      fields: [],
    },
  ],
  [
    SimpleEnumSecond,
    {
      kind: "struct",
      fields: [],
    },
  ],
  [
    SimpleEnumThird,
    {
      kind: "struct",
      fields: [],
    },
  ],
  [
    DataEnum,
    {
      kind: "enum",
      field: "enum",
      values: [
        ["Amount", DataEnumAmount],
        ["Name", DataEnumName],
      ],
    },
  ],
  [
    DataEnumAmount,
    {
      kind: "struct",
      fields: [["value", "u64"]],
    },
  ],
  [
    DataEnumName,
    {
      kind: "struct",
      fields: [["label", "string"]],
    },
  ],
  [
    PubkeyBytes,
    {
      kind: "struct",
      fields: [["bytes", [32]]],
    },
  ],
  [
    BorshDemoState,
    {
      kind: "struct",
      fields: [
        ["primitive_u8", "u8"],
        ["primitive_u16", "u16"],
        ["primitive_u32", "u32"],
        ["primitive_u64", "u64"],
        ["primitive_i64", I64],
        ["primitive_bool", Bool],
        ["fixed_pubkey_bytes", [32]],
        ["text", "string"],
        ["data", ["u8"]],
        ["keys", [PubkeyBytes]],
        ["simple_enum", SimpleEnum],
        ["data_enum", DataEnum],
        ["maybe_amount", { kind: "option", type: "u64" }],
        ["nested", NestedStruct],
      ],
    },
  ],
  [
    BorshDemoAccount,
    {
      kind: "struct",
      fields: [
        ["discriminator", [8]],
        ["data", BorshDemoState],
      ],
    },
  ],
  [
    InitializeArgs,
    {
      kind: "struct",
      fields: [["data", BorshDemoState]],
    },
  ],
  [
    UpdateArgs,
    {
      kind: "struct",
      fields: [
        ["new_u64", "u64"],
        ["new_bool", Bool],
        ["new_text", "string"],
        ["new_option", { kind: "option", type: "u64" }],
      ],
    },
  ],
  [
    ValidateArgs,
    {
      kind: "struct",
      fields: [["expected_u8", "u8"]],
    },
  ],
  [
    BorshDemoInstruction,
    {
      kind: "enum",
      field: "enum",
      values: [
        ["Initialize", InitializeArgs],
        ["Update", UpdateArgs],
        ["Validate", ValidateArgs],
      ],
    },
  ],
]);

export function serializeAccount(account: BorshDemoAccount): Uint8Array {
  return serialize(BorshSchema, account);
}

export function deserializeAccount(data: Uint8Array): BorshDemoAccount {
  return deserialize(BorshSchema, BorshDemoAccount, data);
}

export function serializeInstruction(
  instruction: BorshDemoInstruction,
): Uint8Array {
  return serialize(BorshSchema, instruction);
}
