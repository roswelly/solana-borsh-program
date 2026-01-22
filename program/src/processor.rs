use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    msg,
    program::invoke,
    program_error::ProgramError,
    pubkey::Pubkey,
    rent::Rent,
    system_instruction,
    sysvar::Sysvar,
};

use crate::{
    error::BorshDemoError,
    instruction::BorshDemoInstruction,
    state::{BorshDemoAccount, ACCOUNT_DISCRIMINATOR},
};

pub struct Processor;

impl Processor {
    pub fn process(program_id: &Pubkey, accounts: &[AccountInfo], input: &[u8]) -> ProgramResult {
        let instruction = BorshDemoInstruction::try_from_slice(input)?;
        match instruction {
            BorshDemoInstruction::Initialize { data } => {
                Self::process_initialize(program_id, accounts, data)
            }
            BorshDemoInstruction::Update {
                new_u64,
                new_bool,
                new_text,
                new_option,
            } => Self::process_update(program_id, accounts, new_u64, new_bool, new_text, new_option),
            BorshDemoInstruction::Validate { expected_u8 } => {
                Self::process_validate(program_id, accounts, expected_u8)
            }
        }
    }

    fn process_initialize(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        data: crate::state::BorshDemoState,
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let payer = next_account_info(account_info_iter)?;
        let state_account = next_account_info(account_info_iter)?;
        let system_program = next_account_info(account_info_iter)?;

        if !payer.is_signer || !state_account.is_signer {
            return Err(ProgramError::MissingRequiredSignature);
        }

        let demo_account = BorshDemoAccount::new(data);
        let serialized = demo_account.try_to_vec()?;
        let account_len = serialized.len();
        let rent = Rent::get()?;
        let required_lamports = rent.minimum_balance(account_len);

        if state_account.owner != program_id {
            msg!("Creating state account with rent-exempt balance");
            invoke(
                &system_instruction::create_account(
                    payer.key,
                    state_account.key,
                    required_lamports,
                    account_len as u64,
                    program_id,
                ),
                &[payer.clone(), state_account.clone(), system_program.clone()],
            )?;
        } else if state_account.data_len() != account_len {
            return Err(BorshDemoError::SizeMismatch.into());
        }

        let mut data_ref = state_account.data.borrow_mut();
        if data_ref.len() != account_len {
            return Err(BorshDemoError::SizeMismatch.into());
        }
        data_ref.copy_from_slice(&serialized);
        Ok(())
    }

    fn process_update(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        new_u64: u64,
        new_bool: bool,
        new_text: String,
        new_option: Option<u64>,
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let state_account = next_account_info(account_info_iter)?;

        if state_account.owner != program_id {
            return Err(ProgramError::IncorrectProgramId);
        }

        let mut demo_account =
            BorshDemoAccount::try_from_slice(&state_account.data.borrow())?;
        if demo_account.discriminator != ACCOUNT_DISCRIMINATOR {
            return Err(BorshDemoError::InvalidDiscriminator.into());
        }

        if demo_account.data.text.len() != new_text.len() {
            return Err(BorshDemoError::StringLengthChange.into());
        }
        if demo_account.data.maybe_amount.is_some() != new_option.is_some() {
            return Err(BorshDemoError::OptionVariantChange.into());
        }

        demo_account.data.primitive_u64 = new_u64;
        demo_account.data.primitive_bool = new_bool;
        demo_account.data.text = new_text;
        demo_account.data.maybe_amount = new_option;

        let serialized = demo_account.try_to_vec()?;
        if state_account.data_len() != serialized.len() {
            return Err(BorshDemoError::SizeMismatch.into());
        }
        state_account.data.borrow_mut().copy_from_slice(&serialized);
        Ok(())
    }

    fn process_validate(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        expected_u8: u8,
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let state_account = next_account_info(account_info_iter)?;

        if state_account.owner != program_id {
            return Err(ProgramError::IncorrectProgramId);
        }

        let demo_account =
            BorshDemoAccount::try_from_slice(&state_account.data.borrow())?;
        if demo_account.discriminator != ACCOUNT_DISCRIMINATOR {
            return Err(BorshDemoError::InvalidDiscriminator.into());
        }

        if demo_account.data.primitive_u8 != expected_u8 {
            msg!("Validation failed: expected {}, got {}", expected_u8, demo_account.data.primitive_u8);
            return Err(ProgramError::InvalidAccountData);
        }
        msg!("Validation passed");
        Ok(())
    }
}
