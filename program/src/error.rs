use thiserror::Error;

#[derive(Error, Debug, Copy, Clone)]
pub enum BorshDemoError {
    #[error("Invalid account discriminator")]
    InvalidDiscriminator,
    #[error("Account data size mismatch")]
    SizeMismatch,
    #[error("String length cannot change after initialization")]
    StringLengthChange,
    #[error("Option variant cannot change after initialization")]
    OptionVariantChange,
}

impl From<BorshDemoError> for solana_program::program_error::ProgramError {
    fn from(err: BorshDemoError) -> Self {
        solana_program::program_error::ProgramError::Custom(err as u32)
    }
}
