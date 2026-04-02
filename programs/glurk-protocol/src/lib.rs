use anchor_lang::prelude::*;

declare_id!("5FVzW7QwuETtRnBfXom3b2Rxd2R6weo1285Fywg66fCQ"); // Updated after deploy

#[program]
pub mod glurk_protocol {
    use super::*;

    /// Register a new issuer in the protocol.
    /// Only the protocol admin can call this.
    pub fn register_issuer(
        ctx: Context<RegisterIssuer>,
        name: String,
    ) -> Result<()> {
        let issuer = &mut ctx.accounts.issuer_account;
        issuer.authority = ctx.accounts.issuer_authority.key();
        issuer.name = name;
        issuer.trust_score = 50; // baseline
        issuer.credentials_issued = 0;
        issuer.active = true;
        issuer.registered_at = Clock::get()?.unix_timestamp;
        issuer.bump = ctx.bumps.issuer_account;
        Ok(())
    }

    /// Register a credential issued by an approved issuer to a user.
    pub fn register_credential(
        ctx: Context<RegisterCredential>,
        slug: String,
        tier: String,
        score: u8,
        mint_address: Pubkey,
    ) -> Result<()> {
        require!(ctx.accounts.issuer_account.active, GlurkError::IssuerInactive);

        let cred = &mut ctx.accounts.credential_account;
        cred.issuer = ctx.accounts.issuer_authority.key();
        cred.user = ctx.accounts.user.key();
        cred.slug = slug;
        cred.tier = tier;
        cred.score = score;
        cred.mint_address = mint_address;
        cred.timestamp = Clock::get()?.unix_timestamp;
        cred.bump = ctx.bumps.credential_account;

        // Increment issuer's credential count
        let issuer = &mut ctx.accounts.issuer_account;
        issuer.credentials_issued = issuer.credentials_issued.checked_add(1).unwrap_or(issuer.credentials_issued);

        Ok(())
    }

    /// Request access to a user's credentials.
    /// The requesting app MUST provide a data contribution in the same tx.
    /// The user MUST sign (consent).
    pub fn request_access(
        ctx: Context<RequestAccess>,
        contribution_slug: String,
        contribution_tier: String,
        contribution_score: u8,
    ) -> Result<()> {
        require!(ctx.accounts.requester_issuer.active, GlurkError::IssuerInactive);

        // Write the requester's contribution as a credential
        let contribution = &mut ctx.accounts.contribution_account;
        contribution.issuer = ctx.accounts.requester_authority.key();
        contribution.user = ctx.accounts.user.key();
        contribution.slug = contribution_slug;
        contribution.tier = contribution_tier;
        contribution.score = contribution_score;
        contribution.mint_address = Pubkey::default(); // no SBT for contributions
        contribution.timestamp = Clock::get()?.unix_timestamp;
        contribution.bump = ctx.bumps.contribution_account;

        // Create/update consent record
        let consent = &mut ctx.accounts.consent_account;
        consent.user = ctx.accounts.user.key();
        consent.requester = ctx.accounts.requester_authority.key();
        consent.granted_at = Clock::get()?.unix_timestamp;
        consent.active = true;
        consent.bump = ctx.bumps.consent_account;

        Ok(())
    }

    /// User revokes an app's access.
    pub fn revoke_access(ctx: Context<RevokeAccess>) -> Result<()> {
        let consent = &mut ctx.accounts.consent_account;
        require!(consent.user == ctx.accounts.user.key(), GlurkError::Unauthorized);
        consent.active = false;
        Ok(())
    }

    /// Protocol admin deactivates an issuer.
    pub fn deactivate_issuer(ctx: Context<DeactivateIssuer>) -> Result<()> {
        let issuer = &mut ctx.accounts.issuer_account;
        issuer.active = false;
        Ok(())
    }
}

// ─── Accounts ───

#[derive(Accounts)]
#[instruction(name: String)]
pub struct RegisterIssuer<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    /// CHECK: The issuer's authority pubkey
    pub issuer_authority: UncheckedAccount<'info>,

    #[account(
        init,
        payer = admin,
        space = 8 + IssuerAccount::INIT_SPACE,
        seeds = [b"issuer", issuer_authority.key().as_ref()],
        bump,
    )]
    pub issuer_account: Account<'info, IssuerAccount>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(slug: String, tier: String, score: u8, mint_address: Pubkey)]
pub struct RegisterCredential<'info> {
    #[account(mut)]
    pub issuer_authority: Signer<'info>,

    #[account(
        seeds = [b"issuer", issuer_authority.key().as_ref()],
        bump = issuer_account.bump,
        constraint = issuer_account.authority == issuer_authority.key() @ GlurkError::Unauthorized,
    )]
    pub issuer_account: Account<'info, IssuerAccount>,

    /// CHECK: The user receiving the credential
    pub user: UncheckedAccount<'info>,

    #[account(
        init,
        payer = issuer_authority,
        space = 8 + CredentialAccount::INIT_SPACE,
        seeds = [b"credential", issuer_authority.key().as_ref(), user.key().as_ref(), slug.as_bytes()],
        bump,
    )]
    pub credential_account: Account<'info, CredentialAccount>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(contribution_slug: String, contribution_tier: String, contribution_score: u8)]
pub struct RequestAccess<'info> {
    #[account(mut)]
    pub requester_authority: Signer<'info>,

    /// The user MUST also sign — this is consent
    pub user: Signer<'info>,

    #[account(
        seeds = [b"issuer", requester_authority.key().as_ref()],
        bump = requester_issuer.bump,
        constraint = requester_issuer.authority == requester_authority.key() @ GlurkError::Unauthorized,
    )]
    pub requester_issuer: Account<'info, IssuerAccount>,

    #[account(
        init,
        payer = requester_authority,
        space = 8 + CredentialAccount::INIT_SPACE,
        seeds = [b"credential", requester_authority.key().as_ref(), user.key().as_ref(), contribution_slug.as_bytes()],
        bump,
    )]
    pub contribution_account: Account<'info, CredentialAccount>,

    #[account(
        init_if_needed,
        payer = requester_authority,
        space = 8 + ConsentAccount::INIT_SPACE,
        seeds = [b"consent", user.key().as_ref(), requester_authority.key().as_ref()],
        bump,
    )]
    pub consent_account: Account<'info, ConsentAccount>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RevokeAccess<'info> {
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"consent", user.key().as_ref(), requester.key().as_ref()],
        bump = consent_account.bump,
    )]
    pub consent_account: Account<'info, ConsentAccount>,

    /// CHECK: The requester whose access is being revoked
    pub requester: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct DeactivateIssuer<'info> {
    pub admin: Signer<'info>,

    #[account(mut)]
    pub issuer_account: Account<'info, IssuerAccount>,
}

// ─── State ───

#[account]
#[derive(InitSpace)]
pub struct IssuerAccount {
    pub authority: Pubkey,
    #[max_len(64)]
    pub name: String,
    pub trust_score: u8,
    pub credentials_issued: u64,
    pub active: bool,
    pub registered_at: i64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct CredentialAccount {
    pub issuer: Pubkey,
    pub user: Pubkey,
    #[max_len(64)]
    pub slug: String,
    #[max_len(16)]
    pub tier: String,
    pub score: u8,
    pub mint_address: Pubkey,
    pub timestamp: i64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct ConsentAccount {
    pub user: Pubkey,
    pub requester: Pubkey,
    pub granted_at: i64,
    pub active: bool,
    pub bump: u8,
}

// ─── Errors ───

#[error_code]
pub enum GlurkError {
    #[msg("Issuer is not active")]
    IssuerInactive,
    #[msg("Unauthorized")]
    Unauthorized,
}
# trigger build
