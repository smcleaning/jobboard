-- ============================================================
-- SMC JOB BOARD - Supabase Database Schema
-- Run this in your Supabase SQL Editor (supabase.com/dashboard)
-- ============================================================

-- 1. WORKERS TABLE
CREATE TABLE IF NOT EXISTS workers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  pin_hash VARCHAR(255) NOT NULL,
  experience VARCHAR(20) DEFAULT 'none' CHECK (experience IN ('none', 'less_than_1yr', '1_to_3yr', '3_plus_yr')),
  areas TEXT[] DEFAULT '{}',
  available_days BOOLEAN[] DEFAULT '{true,true,true,true,true,false,false}',
  earliest_start TIME DEFAULT '07:00',
  latest_end TIME DEFAULT '17:00',
  transportation VARCHAR(20) DEFAULT 'drives' CHECK (transportation IN ('drives', 'transit', 'none')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'inactive')),
  language VARCHAR(5) DEFAULT 'en' CHECK (language IN ('en', 'es')),
  is_admin BOOLEAN DEFAULT false,
  today_available VARCHAR(20) DEFAULT 'available' CHECK (today_available IN ('available', 'unavailable', 'partial')),
  today_available_note VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  last_active TIMESTAMPTZ DEFAULT NOW()
);

-- 2. JOBS TABLE
CREATE TABLE IF NOT EXISTS jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  location_address TEXT,
  location_city VARCHAR(50),
  job_date DATE NOT NULL,
  start_time TIME NOT NULL,
  duration_hours DECIMAL(4,1) DEFAULT 4,
  pay_amount DECIMAL(8,2) NOT NULL,
  job_type VARCHAR(30) DEFAULT 'residential' CHECK (job_type IN ('airbnb', 'deep_clean', 'commercial', 'restaurant', 'residential', 'common_area')),
  urgency VARCHAR(20) DEFAULT 'today' CHECK (urgency IN ('urgent', 'today', 'flexible')),
  notes TEXT,
  workers_needed INTEGER DEFAULT 1,
  workers_claimed INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'filled', 'completed', 'cancelled')),
  posted_by UUID REFERENCES workers(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CLAIMS TABLE
CREATE TABLE IF NOT EXISTS claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  claimed_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'claimed' CHECK (status IN ('claimed', 'completed', 'no_show', 'cancelled')),
  UNIQUE(job_id, worker_id)
);

-- 4. INDEXES
CREATE INDEX IF NOT EXISTS idx_jobs_date ON jobs(job_date);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_claims_worker ON claims(worker_id);
CREATE INDEX IF NOT EXISTS idx_claims_job ON claims(job_id);
CREATE INDEX IF NOT EXISTS idx_workers_phone ON workers(phone);
CREATE INDEX IF NOT EXISTS idx_workers_status ON workers(status);

-- 5. ENABLE ROW LEVEL SECURITY
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;

-- 6. RLS POLICIES - Allow all operations via service role (API routes use service role key)
-- Public read for approved workers and open jobs (accessed via anon key from client)
CREATE POLICY "Allow all for service role" ON workers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service role" ON jobs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service role" ON claims FOR ALL USING (true) WITH CHECK (true);

-- 7. HELPER FUNCTION: Auto-update job status when claims reach workers_needed
CREATE OR REPLACE FUNCTION update_job_on_claim()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE jobs
  SET workers_claimed = (SELECT COUNT(*) FROM claims WHERE job_id = NEW.job_id AND status = 'claimed'),
      status = CASE
        WHEN (SELECT COUNT(*) FROM claims WHERE job_id = NEW.job_id AND status = 'claimed') >= workers_needed THEN 'filled'
        ELSE 'open'
      END
  WHERE id = NEW.job_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_update_job_on_claim
AFTER INSERT OR UPDATE ON claims
FOR EACH ROW EXECUTE FUNCTION update_job_on_claim();

-- 8. HELPER FUNCTION: Update last_active on worker actions
CREATE OR REPLACE FUNCTION update_worker_last_active()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE workers SET last_active = NOW() WHERE id = NEW.worker_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_update_worker_activity
AFTER INSERT ON claims
FOR EACH ROW EXECUTE FUNCTION update_worker_last_active();

-- ============================================================
-- DONE! Now create your admin worker account via the app signup
-- or insert one manually:
-- ============================================================
-- INSERT INTO workers (full_name, phone, pin_hash, status, is_admin)
-- VALUES ('Jose Gonzalez', 'YOUR_PHONE', 'HASH_YOUR_PIN', 'approved', true);
