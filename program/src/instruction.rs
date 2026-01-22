use borsh::{BorshDeserialize, BorshSerialize};

use crate::state::BorshDemoState;

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub enum BorshDemoInstruction {
    /// Creates (or initializes) the account and stores the full state.
    Initialize { data: BorshDemoState },
    /// Updates fields while keeping the serialized length unchanged.
    Update {
        new_u64: u64,
        new_bool: bool,
        new_text: String,
        new_option: Option<u64>,
    },
    /// Reads the account data and validates a field.
    Validate { expected_u8: u8 },
}
