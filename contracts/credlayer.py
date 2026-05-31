# v0.2.17
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
import json


class CredLayer(gl.Contract):
    owner: str

    borrowers: TreeMap[str, str]
    lenders: TreeMap[str, str]
    credit_profiles: TreeMap[str, str]
    loans: TreeMap[str, str]
    repayment_history: TreeMap[str, str]
    risk_assessments: TreeMap[str, str]
    liquidity_pools: TreeMap[str, str]

    treasury: str
    protocol_fees: str

    loan_counter: u256
    pool_counter: u256

    def __init__(self) -> None:
        self.owner = str(gl.message.sender_address)

        self.borrowers = TreeMap()
        self.lenders = TreeMap()
        self.credit_profiles = TreeMap()
        self.loans = TreeMap()
        self.repayment_history = TreeMap()
        self.risk_assessments = TreeMap()
        self.liquidity_pools = TreeMap()

        self.treasury = json.dumps({
            "total_deposited": 0,
            "total_borrowed": 0,
            "total_repaid": 0,
            "total_defaults": 0,
            "reserve_ratio": 20,
            "last_updated": "0",
        })

        self.protocol_fees = json.dumps({
            "total_collected": 0,
            "origination_fee_bps": 100,
            "late_fee_bps": 200,
            "default_penalty_bps": 500,
        })

        self.loan_counter = u256(0)
        self.pool_counter = u256(0)

    # ---------------------------------------------------------------------
    # Internal helpers
    # ---------------------------------------------------------------------

    def _caller(self) -> str:
        return str(gl.message.sender_address)

    def _now(self) -> str:
        return "0"

    def _loads(self, raw: str, fallback):
        if raw is None or raw == "":
            return fallback
        return json.loads(raw)

    def _get_borrower(self, wallet: str) -> dict:
        return self._loads(self.borrowers.get(wallet), {})

    def _save_borrower(self, wallet: str, data: dict) -> None:
        self.borrowers[wallet] = json.dumps(data)

    def _get_lender(self, wallet: str) -> dict:
        return self._loads(self.lenders.get(wallet), {})

    def _save_lender(self, wallet: str, data: dict) -> None:
        self.lenders[wallet] = json.dumps(data)

    def _get_credit_profile(self, wallet: str) -> dict:
        return self._loads(self.credit_profiles.get(wallet), {})

    def _save_credit_profile(self, wallet: str, data: dict) -> None:
        self.credit_profiles[wallet] = json.dumps(data)

    def _get_loan(self, loan_id: str) -> dict:
        return self._loads(self.loans.get(loan_id), {})

    def _save_loan(self, loan_id: str, data: dict) -> None:
        self.loans[loan_id] = json.dumps(data)

    def _get_pool(self, pool_id: str) -> dict:
        return self._loads(self.liquidity_pools.get(pool_id), {})

    def _save_pool(self, pool_id: str, data: dict) -> None:
        self.liquidity_pools[pool_id] = json.dumps(data)

    def _get_history(self, wallet: str) -> list:
        return self._loads(self.repayment_history.get(wallet), [])

    def _save_history(self, wallet: str, data: list) -> None:
        self.repayment_history[wallet] = json.dumps(data)

    def _get_treasury(self) -> dict:
        return json.loads(self.treasury)

    def _save_treasury(self, data: dict) -> None:
        data["last_updated"] = self._now()
        self.treasury = json.dumps(data)

    def _get_protocol_fees(self) -> dict:
        return json.loads(self.protocol_fees)

    def _save_protocol_fees(self, data: dict) -> None:
        self.protocol_fees = json.dumps(data)

    def _parse_json_object(self, raw: str) -> dict:
        cleaned = raw.strip()

        if cleaned.startswith("```"):
            cleaned = cleaned.replace("```json", "")
            cleaned = cleaned.replace("```", "")
            cleaned = cleaned.strip()

        return json.loads(cleaned)

    def _require_owner(self) -> None:
        if self._caller() != self.owner:
            raise Exception("Only owner can perform this action")

    # ---------------------------------------------------------------------
    # Borrower profile
    # ---------------------------------------------------------------------

    @gl.public.write
    def create_borrower_profile(
        self,
        full_name: str,
        email_hash: str,
        country: str,
        occupation: str,
        monthly_income_usd: u256,
        loan_purpose: str,
    ) -> None:
        sender = self._caller()

        if self.borrowers.get(sender) is not None:
            raise Exception("Profile already exists")

        profile = {
            "wallet": sender,
            "full_name": full_name,
            "email_hash": email_hash,
            "country": country,
            "occupation": occupation,
            "monthly_income_usd": int(monthly_income_usd),
            "loan_purpose": loan_purpose,
            "kyc_status": "PENDING",
            "identity_score": 0,
            "kyc_level": "NONE",
            "created_at": self._now(),
            "updated_at": self._now(),
            "active_loans": 0,
            "completed_loans": 0,
            "defaults": 0,
        }

        credit_profile = {
            "wallet": sender,
            "credit_score": 0,
            "reputation_score": 0,
            "reputation_tier": "Unverified",
            "identity_score": 0,
            "repayment_score": 0,
            "wallet_trust_score": 0,
            "income_score": 0,
            "governance_score": 0,
            "total_borrowed": 0,
            "total_repaid": 0,
            "active_loan_count": 0,
            "fraud_risk": "UNKNOWN",
            "last_evaluated": "",
            "approved_loans": [],
            "created_at": self._now(),
        }

        self._save_borrower(sender, profile)
        self._save_credit_profile(sender, credit_profile)
        self._save_history(sender, [])

    @gl.public.write
    def update_borrower_profile(
        self,
        full_name: str,
        occupation: str,
        monthly_income_usd: u256,
        loan_purpose: str,
    ) -> None:
        sender = self._caller()
        profile = self._get_borrower(sender)

        if profile == {}:
            raise Exception("Profile not found")

        profile["full_name"] = full_name
        profile["occupation"] = occupation
        profile["monthly_income_usd"] = int(monthly_income_usd)
        profile["loan_purpose"] = loan_purpose
        profile["updated_at"] = self._now()

        self._save_borrower(sender, profile)

    @gl.public.write
    def submit_identity_verification(
        self,
        document_type: str,
        document_hash: str,
        selfie_hash: str,
        proof_of_address_hash: str,
    ) -> None:
        sender = self._caller()
        profile = self._get_borrower(sender)

        if profile == {}:
            raise Exception("Profile not found")

        profile["kyc_status"] = "UNDER_REVIEW"
        profile["identity_documents"] = {
            "document_type": document_type,
            "document_hash": document_hash,
            "selfie_hash": selfie_hash,
            "proof_of_address_hash": proof_of_address_hash,
            "submitted_at": self._now(),
        }
        profile["updated_at"] = self._now()
        self._save_borrower(sender, profile)

        result = yield gl.eq_principle.prompt_non_comparative(
            f"""
You are a KYC verification officer for a DeFi lending protocol.

A borrower submitted identity verification.

Document type: {document_type}
Document hash: {document_hash}
Selfie hash: {selfie_hash}
Proof of address hash: {proof_of_address_hash}

Return ONLY valid JSON:

{{
  "status": "VERIFIED" or "REJECTED",
  "identity_score": 0,
  "rejection_reason": "",
  "kyc_level": "BASIC"
}}
"""
        )

        parsed = self._parse_json_object(result)

        profile["kyc_status"] = parsed.get("status", "REJECTED")
        profile["identity_score"] = int(parsed.get("identity_score", 0))
        profile["kyc_level"] = parsed.get("kyc_level", "BASIC")
        profile["kyc_rejection_reason"] = parsed.get("rejection_reason", "")
        profile["updated_at"] = self._now()

        self._save_borrower(sender, profile)

        cp = self._get_credit_profile(sender)
        cp["identity_score"] = profile["identity_score"]
        self._save_credit_profile(sender, cp)

    # ---------------------------------------------------------------------
    # Loans
    # ---------------------------------------------------------------------

    @gl.public.write
    def request_loan(
        self,
        amount_usd: u256,
        duration_days: u256,
        loan_type: str,
        purpose: str,
        collateral_amount: u256,
        wallet_age_days: u256,
        total_transactions: u256,
        avg_balance_usd: u256,
        github_contributions: u256,
        dao_votes: u256,
        income_documents_hash: str,
    ) -> str:
        sender = self._caller()
        borrower = self._get_borrower(sender)

        if borrower == {}:
            raise Exception("Borrower profile not found")

        if borrower.get("kyc_status") != "VERIFIED":
            raise Exception("KYC verification required")

        valid_types = [
            "PERSONAL",
            "BUSINESS",
            "CREATOR",
            "FREELANCER",
            "DAO_CONTRIBUTOR",
            "REPUTATION_BACKED",
        ]

        if loan_type not in valid_types:
            raise Exception("Invalid loan type")

        repayment_hist = self._get_history(sender)
        completed = 0
        late = 0

        for record in repayment_hist:
            if record.get("status") == "COMPLETED":
                completed += 1
            if record.get("status") == "LATE":
                late += 1

        defaults = int(borrower.get("defaults", 0))

        assessment = yield from self._evaluate_creditworthiness(
            sender,
            amount_usd,
            duration_days,
            loan_type,
            purpose,
            u256(int(borrower.get("monthly_income_usd", 0))),
            wallet_age_days,
            total_transactions,
            avg_balance_usd,
            github_contributions,
            dao_votes,
            u256(int(borrower.get("identity_score", 0))),
            completed,
            late,
            defaults,
            income_documents_hash,
        )

        self.loan_counter = u256(int(self.loan_counter) + 1)
        loan_id = "loan_" + str(int(self.loan_counter)) + "_" + sender[:8]

        approval_hash = (
            "approval_"
            + loan_id
            + "_"
            + str(assessment.get("credit_score", 0))
            + "_"
            + str(assessment.get("decision", "REJECT"))
        )

        status = "REJECTED"
        if assessment.get("decision") == "APPROVE":
            status = "PENDING_APPROVAL"

        loan = {
            "loan_id": loan_id,
            "borrower": sender,
            "amount_usd": int(amount_usd),
            "duration_days": int(duration_days),
            "loan_type": loan_type,
            "purpose": purpose,
            "collateral_amount": int(collateral_amount),
            "status": status,
            "credit_score": int(assessment.get("credit_score", 500)),
            "risk_level": assessment.get("risk_level", "HIGH"),
            "interest_rate": int(assessment.get("interest_rate", 15)),
            "required_collateral_ratio": int(assessment.get("required_collateral_ratio", 70)),
            "max_loan_amount": int(assessment.get("max_loan_amount", 0)),
            "confidence": assessment.get("confidence", 0),
            "reasoning": assessment.get("reasoning", ""),
            "positive_factors": assessment.get("positive_factors", []),
            "risk_factors": assessment.get("risk_factors", []),
            "approval_hash": approval_hash,
            "approval_timestamp": self._now(),
            "consensus_id": "consensus_" + loan_id,
            "requested_at": self._now(),
            "activated_at": "",
            "due_date": "",
            "repaid_at": "",
            "total_repaid": 0,
            "is_immutable": assessment.get("decision") == "APPROVE",
        }

        self._save_loan(loan_id, loan)

        self.risk_assessments[loan_id] = json.dumps({
            "wallet": sender,
            "loan_id": loan_id,
            "assessment": assessment,
            "approval_hash": approval_hash,
            "evaluated_at": self._now(),
        })

        cp = self._get_credit_profile(sender)
        cp["credit_score"] = int(assessment.get("credit_score", 500))
        cp["fraud_risk"] = assessment.get("fraud_risk", "LOW")
        cp["wallet_trust_score"] = self._calculate_wallet_trust_score(
            wallet_age_days,
            total_transactions,
            avg_balance_usd,
        )
        cp["income_score"] = self._calculate_income_score(
            u256(int(borrower.get("monthly_income_usd", 0))),
            amount_usd,
            avg_balance_usd,
        )
        cp["governance_score"] = self._calculate_governance_score(
            github_contributions,
            dao_votes,
        )
        cp["last_evaluated"] = self._now()

        self._save_credit_profile(sender, cp)

        return loan_id

    @gl.public.write
    def accept_conditional_offer(self, loan_id: str) -> None:
        sender = self._caller()
        loan = self._get_loan(loan_id)

        if loan == {}:
            raise Exception("Loan not found")

        if loan.get("borrower") != sender:
            raise Exception("Not authorized")

        if loan.get("status") != "PENDING_APPROVAL":
            raise Exception("Loan not in pending approval state")

        loan["status"] = "APPROVED"
        loan["accepted_at"] = self._now()

        self._save_loan(loan_id, loan)

    @gl.public.write
    def cancel_loan_request(self, loan_id: str) -> None:
        sender = self._caller()
        loan = self._get_loan(loan_id)

        if loan == {}:
            raise Exception("Loan not found")

        if loan.get("borrower") != sender:
            raise Exception("Not authorized")

        if loan.get("status") not in ["PENDING_APPROVAL", "APPROVED"]:
            raise Exception("Cannot cancel loan in current state")

        loan["status"] = "CANCELLED"
        loan["cancelled_at"] = self._now()

        self._save_loan(loan_id, loan)

    @gl.public.write
    def activate_loan(self, loan_id: str, pool_id: str) -> None:
        loan = self._get_loan(loan_id)

        if loan == {}:
            raise Exception("Loan not found")

        if loan.get("status") != "APPROVED":
            raise Exception("Loan must be approved before activation")

        pool = self._get_pool(pool_id)

        if pool == {}:
            raise Exception("Pool not found")

        if pool.get("status") != "ACTIVE":
            raise Exception("Pool not active")

        if int(pool.get("available_liquidity", 0)) < int(loan.get("amount_usd", 0)):
            raise Exception("Insufficient pool liquidity")

        pool["available_liquidity"] = int(pool.get("available_liquidity", 0)) - int(loan["amount_usd"])
        pool["total_borrowed"] = int(pool.get("total_borrowed", 0)) + int(loan["amount_usd"])
        pool["active_loans"] = int(pool.get("active_loans", 0)) + 1

        self._save_pool(pool_id, pool)

        loan["status"] = "ACTIVE"
        loan["pool_id"] = pool_id
        loan["activated_at"] = self._now()
        loan["due_date"] = str(int(loan["duration_days"]) * 86400)

        self._save_loan(loan_id, loan)

        borrower = self._get_borrower(loan["borrower"])
        borrower["active_loans"] = int(borrower.get("active_loans", 0)) + 1
        self._save_borrower(loan["borrower"], borrower)

        treasury = self._get_treasury()
        treasury["total_borrowed"] = int(treasury.get("total_borrowed", 0)) + int(loan["amount_usd"])
        self._save_treasury(treasury)

    @gl.public.write
    def repay_loan(self, loan_id: str, amount_usd: u256) -> None:
        sender = self._caller()
        loan = self._get_loan(loan_id)

        if loan == {}:
            raise Exception("Loan not found")

        if loan.get("borrower") != sender:
            raise Exception("Not authorized")

        if loan.get("status") != "ACTIVE":
            raise Exception("Loan not active")

        fees = self._get_protocol_fees()

        fee_bps = int(fees.get("origination_fee_bps", 100))
        fee_amount = (int(amount_usd) * fee_bps) // 10000
        net_amount = int(amount_usd) - fee_amount

        loan["total_repaid"] = int(loan.get("total_repaid", 0)) + net_amount

        principal = int(loan["amount_usd"])
        rate = int(loan.get("interest_rate", 15))
        days = int(loan.get("duration_days", 30))

        interest = (principal * rate * days) // (100 * 365)
        total_owed = principal + interest

        status = "PARTIAL"

        if int(loan["total_repaid"]) >= total_owed:
            status = "COMPLETED"

        repayment_record = {
            "loan_id": loan_id,
            "amount": int(amount_usd),
            "fee": fee_amount,
            "net_amount": net_amount,
            "status": status,
            "repaid_at": self._now(),
        }

        history = self._get_history(sender)
        history.append(repayment_record)
        self._save_history(sender, history)

        fees["total_collected"] = int(fees.get("total_collected", 0)) + fee_amount
        self._save_protocol_fees(fees)

        if status == "COMPLETED":
            loan["status"] = "REPAID"
            loan["repaid_at"] = self._now()

            pool_id = loan.get("pool_id", "")

            if pool_id != "":
                pool = self._get_pool(pool_id)

                if pool != {}:
                    pool["available_liquidity"] = int(pool.get("available_liquidity", 0)) + int(loan["total_repaid"])
                    pool["total_repaid"] = int(pool.get("total_repaid", 0)) + int(loan["total_repaid"])
                    pool["active_loans"] = max(0, int(pool.get("active_loans", 0)) - 1)
                    self._save_pool(pool_id, pool)

            borrower = self._get_borrower(sender)
            borrower["active_loans"] = max(0, int(borrower.get("active_loans", 0)) - 1)
            borrower["completed_loans"] = int(borrower.get("completed_loans", 0)) + 1
            self._save_borrower(sender, borrower)

            treasury = self._get_treasury()
            treasury["total_repaid"] = int(treasury.get("total_repaid", 0)) + int(loan["total_repaid"])
            self._save_treasury(treasury)

            self._update_reputation(sender, "REPAID")

        self._save_loan(loan_id, loan)

    @gl.public.write
    def mark_default(self, loan_id: str) -> None:
        self._require_owner()

        loan = self._get_loan(loan_id)

        if loan == {}:
            raise Exception("Loan not found")

        if loan.get("status") != "ACTIVE":
            raise Exception("Loan not active")

        loan["status"] = "DEFAULTED"
        loan["defaulted_at"] = self._now()

        self._save_loan(loan_id, loan)

        borrower_addr = loan["borrower"]
        borrower = self._get_borrower(borrower_addr)

        borrower["active_loans"] = max(0, int(borrower.get("active_loans", 0)) - 1)
        borrower["defaults"] = int(borrower.get("defaults", 0)) + 1

        self._save_borrower(borrower_addr, borrower)

        treasury = self._get_treasury()
        treasury["total_defaults"] = int(treasury.get("total_defaults", 0)) + int(loan["amount_usd"])
        self._save_treasury(treasury)

        self._update_reputation(borrower_addr, "DEFAULTED")

    # ---------------------------------------------------------------------
    # Liquidity pools
    # ---------------------------------------------------------------------

    @gl.public.write
    def create_pool(
        self,
        name: str,
        target_return_bps: u256,
        min_credit_score: u256,
        max_loan_amount: u256,
        risk_tier: str,
    ) -> str:
        self._require_owner()

        if risk_tier not in ["LOW", "MEDIUM", "HIGH"]:
            raise Exception("Invalid risk tier")

        self.pool_counter = u256(int(self.pool_counter) + 1)
        pool_id = "pool_" + str(int(self.pool_counter))

        pool = {
            "pool_id": pool_id,
            "name": name,
            "target_return_bps": int(target_return_bps),
            "min_credit_score": int(min_credit_score),
            "max_loan_amount": int(max_loan_amount),
            "risk_tier": risk_tier,
            "status": "ACTIVE",
            "total_deposited": 0,
            "available_liquidity": 0,
            "total_borrowed": 0,
            "total_repaid": 0,
            "active_loans": 0,
            "depositors": {},
            "created_at": self._now(),
        }

        self._save_pool(pool_id, pool)

        return pool_id

    @gl.public.write
    def deposit_liquidity(self, pool_id: str, amount_usd: u256) -> None:
        sender = self._caller()
        pool = self._get_pool(pool_id)

        if pool == {}:
            raise Exception("Pool not found")

        if pool.get("status") != "ACTIVE":
            raise Exception("Pool not active")

        amount = int(amount_usd)

        pool["total_deposited"] = int(pool.get("total_deposited", 0)) + amount
        pool["available_liquidity"] = int(pool.get("available_liquidity", 0)) + amount

        depositors = pool.get("depositors", {})
        depositors[sender] = int(depositors.get(sender, 0)) + amount
        pool["depositors"] = depositors

        self._save_pool(pool_id, pool)

        treasury = self._get_treasury()
        treasury["total_deposited"] = int(treasury.get("total_deposited", 0)) + amount
        self._save_treasury(treasury)

        lender = self._get_lender(sender)

        if lender == {}:
            lender = {
                "wallet": sender,
                "total_deposited": 0,
                "total_earned": 0,
                "active_pools": [],
                "joined_at": self._now(),
            }

        lender["total_deposited"] = int(lender.get("total_deposited", 0)) + amount

        active_pools = lender.get("active_pools", [])

        if pool_id not in active_pools:
            active_pools.append(pool_id)

        lender["active_pools"] = active_pools

        self._save_lender(sender, lender)

    @gl.public.write
    def withdraw_liquidity(self, pool_id: str, amount_usd: u256) -> None:
        sender = self._caller()
        pool = self._get_pool(pool_id)

        if pool == {}:
            raise Exception("Pool not found")

        amount = int(amount_usd)

        depositors = pool.get("depositors", {})

        if sender not in depositors:
            raise Exception("No deposit found")

        if int(depositors.get(sender, 0)) < amount:
            raise Exception("Insufficient deposit balance")

        if int(pool.get("available_liquidity", 0)) < amount:
            raise Exception("Insufficient available liquidity")

        depositors[sender] = int(depositors.get(sender, 0)) - amount
        pool["depositors"] = depositors
        pool["available_liquidity"] = int(pool.get("available_liquidity", 0)) - amount
        pool["total_deposited"] = max(0, int(pool.get("total_deposited", 0)) - amount)

        self._save_pool(pool_id, pool)

        lender = self._get_lender(sender)

        if lender != {}:
            lender["total_deposited"] = max(0, int(lender.get("total_deposited", 0)) - amount)
            self._save_lender(sender, lender)

        treasury = self._get_treasury()
        treasury["total_deposited"] = max(0, int(treasury.get("total_deposited", 0)) - amount)
        self._save_treasury(treasury)

    @gl.public.write
    def close_pool(self, pool_id: str) -> None:
        self._require_owner()

        pool = self._get_pool(pool_id)

        if pool == {}:
            raise Exception("Pool not found")

        if int(pool.get("active_loans", 0)) > 0:
            raise Exception("Pool has active loans")

        pool["status"] = "CLOSED"
        pool["closed_at"] = self._now()

        self._save_pool(pool_id, pool)

    @gl.public.write
    def withdraw_protocol_fees(self, amount: u256) -> None:
        self._require_owner()

        fees = self._get_protocol_fees()
        value = int(amount)

        if int(fees.get("total_collected", 0)) < value:
            raise Exception("Insufficient fees")

        fees["total_collected"] = int(fees.get("total_collected", 0)) - value
        fees["last_withdrawn"] = self._now()

        self._save_protocol_fees(fees)

    # ---------------------------------------------------------------------
    # AI assessment internals
    # ---------------------------------------------------------------------

    def _evaluate_creditworthiness(
        self,
        sender: str,
        amount_usd: u256,
        duration_days: u256,
        loan_type: str,
        purpose: str,
        monthly_income_usd: u256,
        wallet_age_days: u256,
        total_transactions: u256,
        avg_balance_usd: u256,
        github_contributions: u256,
        dao_votes: u256,
        identity_score: u256,
        completed_loans: int,
        late_payments: int,
        defaults: int,
        income_documents_hash: str,
    ):
        fraud_risk = yield from self._detect_fraud(
            sender,
            wallet_age_days,
            total_transactions,
            avg_balance_usd,
        )

        repayment_score = self._calculate_repayment_score(
            completed_loans,
            late_payments,
            defaults,
        )

        wallet_trust_score = self._calculate_wallet_trust_score(
            wallet_age_days,
            total_transactions,
            avg_balance_usd,
        )

        income_score = self._calculate_income_score(
            monthly_income_usd,
            amount_usd,
            avg_balance_usd,
        )

        governance_score = self._calculate_governance_score(
            github_contributions,
            dao_votes,
        )

        result = yield gl.eq_principle.prompt_non_comparative(
            f"""
You are an AI credit analyst for CredLayer, a DeFi under-collateralized lending protocol.

Evaluate this loan application and return a detailed credit assessment.

APPLICANT DATA:
- Wallet address: {sender}
- Requested amount: ${amount_usd} USD
- Loan duration: {duration_days} days
- Loan type: {loan_type}
- Purpose: {purpose}
- Monthly income: ${monthly_income_usd} USD

WALLET METRICS:
- Wallet age: {wallet_age_days} days
- Total transactions: {total_transactions}
- Average balance: ${avg_balance_usd} USD
- Wallet trust score: {wallet_trust_score}/100

IDENTITY & REPUTATION:
- KYC/Identity score: {identity_score}/100
- GitHub contributions: {github_contributions}
- DAO governance votes: {dao_votes}
- Governance score: {governance_score}/100

REPAYMENT HISTORY:
- Completed loans: {completed_loans}
- Late payments: {late_payments}
- Defaults: {defaults}
- Repayment score: {repayment_score}/100

INCOME ASSESSMENT:
- Income score: {income_score}/100
- Income documents hash: {income_documents_hash}

FRAUD RISK: {fraud_risk}

Return ONLY valid JSON:

{{
  "decision": "APPROVE" or "REJECT",
  "credit_score": 500,
  "risk_level": "LOW" or "MEDIUM" or "HIGH" or "CRITICAL",
  "max_loan_amount": 0,
  "required_collateral_ratio": 70,
  "interest_rate": 15,
  "confidence": 0,
  "reasoning": "concise explanation",
  "positive_factors": [],
  "risk_factors": [],
  "fraud_risk": "LOW" or "MEDIUM" or "HIGH" or "CRITICAL"
}}
"""
        )

        assessment = self._parse_json_object(result)

        credit_score = int(assessment.get("credit_score", 500))
        assessment["credit_score"] = max(300, min(850, credit_score))

        if fraud_risk == "CRITICAL":
            assessment["decision"] = "REJECT"
            assessment["risk_level"] = "CRITICAL"
            assessment["fraud_risk"] = "CRITICAL"

        if assessment.get("decision") not in ["APPROVE", "REJECT"]:
            assessment["decision"] = "REJECT"

        if assessment.get("risk_level") not in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]:
            assessment["risk_level"] = "HIGH"

        if "interest_rate" not in assessment:
            assessment["interest_rate"] = self._calculate_interest_rate(
                int(assessment["credit_score"]),
                assessment["risk_level"],
            )

        if "required_collateral_ratio" not in assessment:
            assessment["required_collateral_ratio"] = self._calculate_collateral_ratio(
                int(assessment["credit_score"]),
                assessment["risk_level"],
            )

        return assessment

    def _detect_fraud(
        self,
        sender: str,
        wallet_age_days: u256,
        total_transactions: u256,
        avg_balance_usd: u256,
    ):
        result = yield gl.eq_principle.prompt_non_comparative(
            f"""
You are a fraud detection AI for a DeFi lending protocol.

Analyze this wallet for potential fraud or sybil behaviour:

- Wallet: {sender}
- Age: {wallet_age_days} days
- Total transactions: {total_transactions}
- Average balance: ${avg_balance_usd} USD

Return ONLY one word:
LOW, MEDIUM, HIGH, or CRITICAL
"""
        )

        cleaned = result.strip().replace('"', "").upper()

        if cleaned not in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]:
            return "MEDIUM"

        return cleaned

    # ---------------------------------------------------------------------
    # Score helpers
    # ---------------------------------------------------------------------

    def _calculate_repayment_score(
        self,
        completed: int,
        late: int,
        defaults: int,
    ) -> int:
        if defaults > 0:
            return max(0, 20 - defaults * 10)

        if completed == 0:
            return 50

        score = min(100, completed * 15)
        score -= late * 5

        return max(0, score)

    def _calculate_wallet_trust_score(
        self,
        age_days: u256,
        transactions: u256,
        avg_balance: u256,
    ) -> int:
        age_score = min(40, int(age_days) // 10)
        tx_score = min(30, int(transactions) // 10)
        balance_score = min(30, int(avg_balance) // 100)

        return age_score + tx_score + balance_score

    def _calculate_income_score(
        self,
        monthly_income: u256,
        loan_amount: u256,
        avg_balance: u256,
    ) -> int:
        if int(monthly_income) == 0:
            return 10

        dti = int(loan_amount) * 100 // (int(monthly_income) * 12)

        if dti > 50:
            return 20

        if dti > 30:
            return 50

        if dti > 20:
            return 70

        return 90

    def _calculate_governance_score(
        self,
        github: u256,
        dao_votes: u256,
    ) -> int:
        gh_score = min(50, int(github) // 5)
        dao_score = min(50, int(dao_votes) * 5)

        return gh_score + dao_score

    def _update_reputation(self, wallet: str, event: str) -> None:
        cp = self._get_credit_profile(wallet)

        if cp == {}:
            return

        if event == "REPAID":
            cp["repayment_score"] = min(100, int(cp.get("repayment_score", 0)) + 10)

        if event == "DEFAULTED":
            cp["repayment_score"] = max(0, int(cp.get("repayment_score", 0)) - 30)
            cp["credit_score"] = max(300, int(cp.get("credit_score", 500)) - 50)

        cp["reputation_score"] = self._calculate_reputation_score(cp)
        cp["reputation_tier"] = self._calculate_credit_tier(int(cp["reputation_score"]))

        self._save_credit_profile(wallet, cp)

    def _calculate_reputation_score(self, cp: dict) -> int:
        identity = int(cp.get("identity_score", 0)) * 25
        repayment = int(cp.get("repayment_score", 0)) * 35
        wallet_trust = int(cp.get("wallet_trust_score", 0)) * 20
        income = int(cp.get("income_score", 0)) * 15
        governance = int(cp.get("governance_score", 0)) * 5

        return (identity + repayment + wallet_trust + income + governance) // 100

    def _calculate_interest_rate(self, credit_score: int, risk_level: str) -> int:
        base_rates = {
            "LOW": 5,
            "MEDIUM": 9,
            "HIGH": 15,
            "CRITICAL": 25,
        }

        base = base_rates.get(risk_level, 15)
        adjustment = max(0, (750 - credit_score) // 50)

        return base + adjustment

    def _calculate_collateral_ratio(
        self,
        credit_score: int,
        risk_level: str,
    ) -> int:
        ratios = {
            "LOW": 20,
            "MEDIUM": 40,
            "HIGH": 70,
            "CRITICAL": 100,
        }

        base = ratios.get(risk_level, 50)

        if credit_score > 750:
            base = max(0, base - 10)

        if credit_score < 500:
            base = min(100, base + 20)

        return base

    def _calculate_credit_tier(self, score: int) -> str:
        if score >= 90:
            return "Institutional"

        if score >= 75:
            return "Platinum"

        if score >= 60:
            return "Gold"

        if score >= 40:
            return "Silver"

        if score >= 20:
            return "Bronze"

        return "Unverified"

    # ---------------------------------------------------------------------
    # Views
    # ---------------------------------------------------------------------

    @gl.public.view
    def get_borrower(self, wallet: str) -> dict:
        return self._get_borrower(wallet)

    @gl.public.view
    def get_credit_profile(self, wallet: str) -> dict:
        return self._get_credit_profile(wallet)

    @gl.public.view
    def get_loan(self, loan_id: str) -> dict:
        return self._get_loan(loan_id)

    @gl.public.view
    def get_pool(self, pool_id: str) -> dict:
        return self._get_pool(pool_id)

    @gl.public.view
    def get_treasury(self) -> dict:
        return self._get_treasury()

    @gl.public.view
    def get_protocol_fees(self) -> dict:
        return self._get_protocol_fees()

    @gl.public.view
    def get_repayment_history(self, wallet: str) -> list:
        return self._get_history(wallet)

    @gl.public.view
    def get_risk_assessment(self, loan_id: str) -> dict:
        return self._loads(self.risk_assessments.get(loan_id), {})

    @gl.public.view
    def get_loans_by_wallet(self, wallet: str) -> list:
        result = []

        for loan_id, raw in self.loans.items():
            loan = json.loads(raw)

            if loan.get("borrower") == wallet:
                result.append(loan)

        return result

    @gl.public.view
    def get_all_pools(self) -> list:
        result = []

        for pool_id, raw in self.liquidity_pools.items():
            result.append(json.loads(raw))

        return result

    @gl.public.view
    def get_reputation(self, wallet: str) -> dict:
        cp = self._get_credit_profile(wallet)
        borrower = self._get_borrower(wallet)
        history = self._get_history(wallet)

        return {
            "wallet": wallet,
            "reputation_score": cp.get("reputation_score", 0),
            "reputation_tier": cp.get("reputation_tier", "Unverified"),
            "credit_score": cp.get("credit_score", 0),
            "identity_score": cp.get("identity_score", 0),
            "repayment_score": cp.get("repayment_score", 0),
            "wallet_trust_score": cp.get("wallet_trust_score", 0),
            "income_score": cp.get("income_score", 0),
            "governance_score": cp.get("governance_score", 0),
            "completed_loans": borrower.get("completed_loans", 0),
            "defaults": borrower.get("defaults", 0),
            "repayment_history_count": len(history),
            "fraud_risk": cp.get("fraud_risk", "UNKNOWN"),
        }