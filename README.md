# Solana Borsh Serialization Reference

This repository is a complete, end-to-end example of Borsh serialization on Solana. It includes:

- An on-chain Rust program that stores every common Solana Borsh data pattern.
- A matching TypeScript client that serializes instructions and deserializes account data.
- Byte layout notes, offsets, and expected hex outputs for deterministic verification.
- Devnet-ready scripts and examples.

## Project Layout

- `program/` — Solana program (Rust, Borsh)
- `client/` — TypeScript serialization + devnet example

## On-chain Program Overview

Account data is serialized as:

```
[8-byte discriminator] + [BorshDemoState]
```

`BorshDemoState` includes:

- primitives: `u8`, `u16`, `u32`, `u64`, `i64`, `bool`
- fixed array: `[u8; 32]` (Pubkey bytes)
- `String`
- `Vec<u8>`
- `Vec<Pubkey>`
- enums: simple and data-bearing
- `Option<u64>`
- nested struct

The program supports:

- **Initialize**: creates the account and serializes the full state (rent-exempt calculation included).
- **Update**: mutates fields and re-serializes, enforcing identical byte length.
- **Validate**: deserializes and validates stored data.

## Build and Deploy (Devnet)

```
cd /root/borsh/program
cargo build-sbf
solana program deploy target/deploy/borsh_demo.so --url devnet
```

Copy the deployed Program ID into `client/src/index.ts`.

## TypeScript Client

Install dependencies and run:

```
cd /root/borsh/client
npm install
npm run example
```

To run against devnet, set a payer keypair and program id in env vars and run:

```
export PAYER_PRIVATE_KEY='[1,2,3,...]'
export PROGRAM_ID='YourDeployedProgramId'
npm run devnet
```

`PAYER_PRIVATE_KEY` can be:
- JSON array (default `solana-keygen` output), e.g. `[1,2,3,...]`
- comma-separated numbers without brackets
- base58-encoded secret key string

You can also create a `.env` in `client/` and fill in values.

## Demo Script and Sample Output

Local serialization proof:

```
cd /root/borsh/client
npm run example
```

Expected output (abbreviated):

```
Account bytes (hex): 424f52534844454d010200...
Matches expected: true
Update instruction (hex): 01050000000000000001020000006869010900000000000000
Matches expected: true
Decoded enum tag: Second
Example pubkey bytes length: 32
```

Devnet end-to-end:

```
cd /root/borsh/client
npm run devnet
```

Expected output:

```
Initialize tx: <signature>
Update tx: <signature>
Validate tx: <signature>
Decoded account primitive_u64: 555
```

## Byte Layout Notes

Borsh encoding rules used in this example:

- integers: little-endian
- `bool`: 1 byte (`0x00` or `0x01`)
- `String`: `u32` length prefix + UTF-8 bytes
- `Vec<T>`: `u32` length prefix + elements
- `Option<T>`: 1-byte tag (`0x00` none, `0x01` some) + value if present
- `enum`: 1-byte tag (variant index) + variant data

### Offsets (BorshDemoState)

Offsets are in bytes from the start of `BorshDemoState` (immediately after the 8-byte discriminator):

- `primitive_u8`: 0 (1 byte)
- `primitive_u16`: 1 (2 bytes)
- `primitive_u32`: 3 (4 bytes)
- `primitive_u64`: 7 (8 bytes)
- `primitive_i64`: 15 (8 bytes)
- `primitive_bool`: 23 (1 byte)
- `fixed_pubkey_bytes`: 24 (32 bytes)
- `text`: 56 (4-byte length + data)
- `data`: 56 + 4 + text.len (4-byte length + data)
- `keys`: after data vec (`4 + 32 * keys.len`)
- `simple_enum`: 1 byte tag
- `data_enum`: 1 byte tag + payload
- `maybe_amount`: 1 byte tag (+ 8 if Some)
- `nested`: `u32` + string

## Expected Hex Outputs

### Update Instruction Example

Update instruction with:

- `new_u64 = 5`
- `new_bool = true`
- `new_text = "hi"`
- `new_option = Some(9)`

Expected hex:

```
01 0500000000000000 01 02000000 6869 01 0900000000000000
```

### Account Serialization Example

Account state with:

```
primitive_u8 = 1
primitive_u16 = 2
primitive_u32 = 3
primitive_u64 = 4
primitive_i64 = -5
primitive_bool = true
fixed_pubkey_bytes = [0; 32]
text = ""
data = []
keys = []
simple_enum = First
data_enum = Amount { value: 0 }
maybe_amount = None
nested = { count: 0, note: "" }
```

Expected hex (discriminator + state):

```
424f52534844454d010200030000000400000000000000fbffffffffffffff01
0000000000000000000000000000000000000000000000000000000000000000
0000000000000000000000000000000000000000000000000000000000000000
```

You can verify these values by running `npm run example`.
