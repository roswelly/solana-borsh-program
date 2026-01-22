use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::pubkey::Pubkey;

pub const ACCOUNT_DISCRIMINATOR: [u8; 8] = *b"BORSHDEM";
pub const DISCRIMINATOR_LEN: usize = 8;

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone, PartialEq)]
pub struct NestedStruct {
    pub count: u32,
    pub note: String,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone, PartialEq)]
pub enum SimpleEnum {
    First,
    Second,
    Third,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone, PartialEq)]
pub enum DataEnum {
    Amount { value: u64 },
    Name { label: String },
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone, PartialEq)]
pub struct BorshDemoState {
    pub primitive_u8: u8,
    pub primitive_u16: u16,
    pub primitive_u32: u32,
    pub primitive_u64: u64,
    pub primitive_i64: i64,
    pub primitive_bool: bool,
    pub fixed_pubkey_bytes: [u8; 32],
    pub text: String,
    pub data: Vec<u8>,
    pub keys: Vec<Pubkey>,
    pub simple_enum: SimpleEnum,
    pub data_enum: DataEnum,
    pub maybe_amount: Option<u64>,
    pub nested: NestedStruct,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone, PartialEq)]
pub struct BorshDemoAccount {
    pub discriminator: [u8; 8],
    pub data: BorshDemoState,
}

impl BorshDemoAccount {
    pub fn new(data: BorshDemoState) -> Self {
        Self {
            discriminator: ACCOUNT_DISCRIMINATOR,
            data,
        }
    }
}
