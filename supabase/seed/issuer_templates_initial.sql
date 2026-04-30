-- Seed templates for the protocol's existing issuers so their dashboards
-- demonstrate the catalog feature. Idempotent (ON CONFLICT DO NOTHING).

-- Staq issuer (also the protocol authority that issues "early-adopter")
insert into public.issuer_credential_templates
  (issuer_authority, slug, name, description, default_tier, default_score, display_order)
values
  ('BqHeLU3efLtFuyVe3XPq6UM11o3dN4WMyVwGrtgogagT', 'early-adopter', 'Glurk Early Adopter',
    'Awarded to wallets that interacted with Glurk during the founding period.',
    'gold', 100, 0),
  ('BqHeLU3efLtFuyVe3XPq6UM11o3dN4WMyVwGrtgogagT', 'credit-score', 'Credit Score Basics',
    'Demonstrated understanding of CIBIL scoring, credit utilization, and how scores are calculated in India.',
    'gold', 80, 10),
  ('BqHeLU3efLtFuyVe3XPq6UM11o3dN4WMyVwGrtgogagT', 'stocks', 'Stock Market Basics',
    'Knows what equities are, how exchanges work, and how to evaluate a publicly listed company.',
    'gold', 80, 20),
  ('BqHeLU3efLtFuyVe3XPq6UM11o3dN4WMyVwGrtgogagT', 'upi', 'UPI Payments',
    'Practical mastery of UPI: P2P transfers, merchant payments, AutoPay, and recovering disputes.',
    'silver', 75, 30),
  ('BqHeLU3efLtFuyVe3XPq6UM11o3dN4WMyVwGrtgogagT', 'mutual-funds', 'Mutual Funds',
    'Understands mutual fund types, expense ratios, NAV, and how to read a scheme document.',
    'gold', 80, 40),
  ('BqHeLU3efLtFuyVe3XPq6UM11o3dN4WMyVwGrtgogagT', 'income-tax', 'Income Tax',
    'Knows how to file ITR, claim deductions, and choose between the old vs new tax regime.',
    'silver', 75, 50),
  ('BqHeLU3efLtFuyVe3XPq6UM11o3dN4WMyVwGrtgogagT', 'sip-basics', 'SIP Basics',
    'Understands rupee-cost averaging, compounding, and why SIPs beat market timing.',
    'silver', 75, 60),
  ('BqHeLU3efLtFuyVe3XPq6UM11o3dN4WMyVwGrtgogagT', 'crypto-basics', 'Crypto Basics',
    'Understands blockchains, wallets, custody, and the differences between L1 and L2.',
    'gold', 80, 70),
  ('BqHeLU3efLtFuyVe3XPq6UM11o3dN4WMyVwGrtgogagT', 'index-funds', 'Index Funds',
    'Understands passive investing, index construction, and the case for low-cost diversification.',
    'gold', 85, 80),
  ('BqHeLU3efLtFuyVe3XPq6UM11o3dN4WMyVwGrtgogagT', 'financial-independence', 'Financial Independence',
    'Top-tier credential — masters savings rate, withdrawal strategies, and the FIRE framework.',
    'platinum', 90, 90)
on conflict (issuer_authority, slug) do nothing;

-- GitHub Reputation issuer
insert into public.issuer_credential_templates
  (issuer_authority, slug, name, description, default_tier, default_score, display_order)
values
  ('JCpNV2vFguuNvQKcpK1Yp8xCmiyhDH7fmc5Noi25Ut4k', 'github-reputation', 'Developer Reputation',
    'Verified developer profile derived from public GitHub activity: repos, stars, contributions.',
    'gold', 80, 0),
  ('JCpNV2vFguuNvQKcpK1Yp8xCmiyhDH7fmc5Noi25Ut4k', 'solana-activity', 'Solana On-Chain Activity',
    'Verified record of meaningful Solana activity: deployed programs, sustained transaction history, NFT/token interactions.',
    'silver', 70, 10)
on conflict (issuer_authority, slug) do nothing;
