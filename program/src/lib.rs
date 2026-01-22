mod error;
mod instruction;
mod processor;
mod state;

use solana_program::{entrypoint, entrypoint::ProgramResult, pubkey::Pubkey};

entrypoint!(process_instruction);

fn process_instruction(
    program_id: &Pubkey,
    accounts: &[solana_program::account_info::AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    processor::Processor::process(program_id, accounts, instruction_data)
}

pub use instruction::BorshDemoInstruction;
pub use state::{
    BorshDemoAccount, BorshDemoState, DataEnum, NestedStruct, SimpleEnum, ACCOUNT_DISCRIMINATOR,
    DISCRIMINATOR_LEN,
};
