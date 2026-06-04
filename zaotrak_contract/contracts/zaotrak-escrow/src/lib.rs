//! ZaoTrak competition escrow
//!
//! Founders lock a prize pool (SEP-41 token) when creating a competition.
//! After off-chain submission review, the founder finalizes winner payouts on-chain
//! and the contract distributes USDC (or any configured token) to winners.

#![no_std]

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, token, Address, Env,
    String, Vec,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    NotFound = 1,
    NotActive = 2,
    NotFinalized = 3,
    AlreadyFinalized = 4,
    InvalidAmount = 5,
    PayoutMismatch = 6,
    TooManyWinners = 7,
    EmptyPayouts = 8,
    Unauthorized = 9,
    AlreadyClaimed = 10,
    NothingToClaim = 11,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum CompetitionStatus {
    Active,
    Finalized,
    Cancelled,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct Competition {
    pub founder: Address,
    pub token: Address,
    pub prize_pool: i128,
    pub winners_count: u32,
    pub status: CompetitionStatus,
    pub title: String,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct Payout {
    pub winner: Address,
    pub amount: i128,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    NextId,
    Competition(u64),
    Payouts(u64),
    Claimed(u64, Address),
}

// ----------------------------------------------------------------------------
// EVENT DEFINITIONS
// ----------------------------------------------------------------------------

#[contractevent]
pub struct CompCreated {
    #[topic]
    pub comp_id: u64,
    pub founder: Address,
    pub token: Address,
    pub amount: i128,
    pub winners_count: u32,
}

#[contractevent(data_format = "single-value")]
pub struct CompCancelled {
    #[topic]
    pub comp_id: u64,
    pub founder: Address,
}

#[contractevent(data_format = "single-value")]
pub struct CompFinalized {
    #[topic]
    pub comp_id: u64,
    pub payout_count: u32,
}

#[contractevent(data_format = "single-value")]
pub struct CompDistributed {
    #[topic]
    pub comp_id: u64,
    pub payout_count: u32,
}

#[contractevent]
pub struct PrizeClaimed {
    #[topic]
    pub comp_id: u64,
    pub winner: Address,
    pub amount: i128,
}

// ----------------------------------------------------------------------------
// HELPER FUNCTIONS
// ----------------------------------------------------------------------------

fn read_next_id(env: &Env) -> u64 {
    env.storage()
        .instance()
        .get(&DataKey::NextId)
        .unwrap_or(0)
}

fn write_next_id(env: &Env, id: u64) {
    env.storage().instance().set(&DataKey::NextId, &id);
}

fn load_competition(env: &Env, id: u64) -> Result<Competition, Error> {
    env.storage()
        .persistent()
        .get(&DataKey::Competition(id))
        .ok_or(Error::NotFound)
}

fn save_competition(env: &Env, id: u64, competition: &Competition) {
    env.storage()
        .persistent()
        .set(&DataKey::Competition(id), competition);
}

fn transfer_in(env: &Env, token: &Address, from: &Address, amount: i128) {
    let client = token::Client::new(env, token);
    client.transfer(from, &env.current_contract_address(), &amount);
}

fn transfer_out(env: &Env, token: &Address, to: &Address, amount: i128) {
    let client = token::Client::new(env, token);
    client.transfer(&env.current_contract_address(), to, &amount);
}

fn validate_payouts(competition: &Competition, payouts: &Vec<Payout>) -> Result<i128, Error> {
    if payouts.is_empty() {
        return Err(Error::EmptyPayouts);
    }
    if payouts.len() > competition.winners_count {
        return Err(Error::TooManyWinners);
    }

    let mut total: i128 = 0;
    for i in 0..payouts.len() {
        let payout = payouts.get(i).unwrap();
        if payout.amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        total = total
            .checked_add(payout.amount)
            .ok_or(Error::InvalidAmount)?;
    }

    if total != competition.prize_pool {
        return Err(Error::PayoutMismatch);
    }

    Ok(total)
}

// ----------------------------------------------------------------------------
// CONTRACT
// ----------------------------------------------------------------------------

#[contract]
pub struct ZaoTrakEscrow;

#[contractimpl]
impl ZaoTrakEscrow {
    /// Returns the next competition id that will be assigned.
    pub fn next_id(env: Env) -> u64 {
        read_next_id(&env)
    }

    /// Create a competition and pull `amount` of `token` from `founder` into escrow.
    pub fn create_competition(
        env: Env,
        founder: Address,
        token: Address,
        amount: i128,
        winners_count: u32,
        title: String,
    ) -> Result<u64, Error> {
        founder.require_auth();

        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        if winners_count == 0 {
            return Err(Error::InvalidAmount);
        }

        transfer_in(&env, &token, &founder, amount);

        let id = read_next_id(&env);
        write_next_id(&env, id + 1);

        let competition = Competition {
            founder: founder.clone(),
            token: token.clone(),
            prize_pool: amount,
            winners_count,
            status: CompetitionStatus::Active,
            title,
        };
        save_competition(&env, id, &competition);

        // Publish the strongly-typed event
        CompCreated {
            comp_id: id,
            founder,
            token,
            amount,
            winners_count,
        }
        .publish(&env);

        Ok(id)
    }

    /// Read competition state.
    pub fn get_competition(env: Env, competition_id: u64) -> Result<Competition, Error> {
        load_competition(&env, competition_id)
    }

    /// Founder-only: cancel an active competition and refund the full escrow.
    pub fn cancel_competition(env: Env, competition_id: u64) -> Result<(), Error> {
        let mut competition = load_competition(&env, competition_id)?;
        competition.founder.require_auth();

        if competition.status != CompetitionStatus::Active {
            return Err(Error::NotActive);
        }

        transfer_out(
            &env,
            &competition.token,
            &competition.founder,
            competition.prize_pool,
        );

        competition.status = CompetitionStatus::Cancelled;
        save_competition(&env, competition_id, &competition);

        CompCancelled {
            comp_id: competition_id,
            founder: competition.founder,
        }
        .publish(&env);

        Ok(())
    }

    /// Founder-only: lock payout schedule after off-chain review.
    pub fn finalize_competition(
        env: Env,
        competition_id: u64,
        payouts: Vec<Payout>,
    ) -> Result<(), Error> {
        let mut competition = load_competition(&env, competition_id)?;
        competition.founder.require_auth();

        if competition.status != CompetitionStatus::Active {
            return Err(Error::NotActive);
        }

        validate_payouts(&competition, &payouts)?;

        env.storage()
            .persistent()
            .set(&DataKey::Payouts(competition_id), &payouts);

        competition.status = CompetitionStatus::Finalized;
        save_competition(&env, competition_id, &competition);

        CompFinalized {
            comp_id: competition_id,
            payout_count: payouts.len(),
        }
        .publish(&env);

        Ok(())
    }

    /// Founder-only: finalize and send all payouts in one transaction.
    pub fn finalize_and_distribute(
        env: Env,
        competition_id: u64,
        payouts: Vec<Payout>,
    ) -> Result<(), Error> {
        let mut competition = load_competition(&env, competition_id)?;
        competition.founder.require_auth();

        if competition.status != CompetitionStatus::Active {
            return Err(Error::NotActive);
        }

        validate_payouts(&competition, &payouts)?;

        for i in 0..payouts.len() {
            let payout = payouts.get(i).unwrap();
            transfer_out(&env, &competition.token, &payout.winner, payout.amount);
            env.storage().persistent().set(
                &DataKey::Claimed(competition_id, payout.winner.clone()),
                &true,
            );
        }

        env.storage()
            .persistent()
            .set(&DataKey::Payouts(competition_id), &payouts);

        competition.status = CompetitionStatus::Finalized;
        save_competition(&env, competition_id, &competition);

        CompDistributed {
            comp_id: competition_id,
            payout_count: payouts.len(),
        }
        .publish(&env);

        Ok(())
    }

    /// Winner claims their allocation after finalize.
    pub fn claim(env: Env, competition_id: u64, winner: Address) -> Result<i128, Error> {
        winner.require_auth();

        let competition = load_competition(&env, competition_id)?;
        if competition.status != CompetitionStatus::Finalized {
            return Err(Error::NotFinalized);
        }

        if env
            .storage()
            .persistent()
            .get(&DataKey::Claimed(competition_id, winner.clone()))
            .unwrap_or(false)
        {
            return Err(Error::AlreadyClaimed);
        }

        let payouts: Vec<Payout> = env
            .storage()
            .persistent()
            .get(&DataKey::Payouts(competition_id))
            .ok_or(Error::NotFound)?;

        let mut amount: i128 = 0;
        for i in 0..payouts.len() {
            let payout = payouts.get(i).unwrap();
            if payout.winner == winner {
                amount = payout.amount;
                break;
            }
        }

        if amount <= 0 {
            return Err(Error::NothingToClaim);
        }

        transfer_out(&env, &competition.token, &winner, amount);
        env.storage()
            .persistent()
            .set(&DataKey::Claimed(competition_id, winner.clone()), &true);

        PrizeClaimed {
            comp_id: competition_id,
            winner,
            amount,
        }
        .publish(&env);

        Ok(amount)
    }

    /// Contract token balance for a competition's escrow asset (sanity check).
    pub fn escrow_balance(env: Env, competition_id: u64) -> Result<i128, Error> {
        let competition = load_competition(&env, competition_id)?;
        let client = token::Client::new(&env, &competition.token);
        Ok(client.balance(&env.current_contract_address()))
    }
}

#[cfg(test)]
mod test;