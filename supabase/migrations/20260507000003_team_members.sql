-- Create team_members table
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    emoji TEXT DEFAULT '👨‍💼',
    specialization TEXT,
    experience TEXT,
    qualifications TEXT,
    bio TEXT,
    visible BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public can view visible team members"
    ON public.team_members
    FOR SELECT
    USING (visible = true);

-- Allow admin/ca to manage team members
CREATE POLICY "Staff can manage team members"
    ON public.team_members
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role IN ('admin', 'ca')
        )
    );

-- Insert default team
INSERT INTO public.team_members (name, role, emoji, specialization, experience, qualifications, bio, sort_order)
VALUES 
('CA Gaurav Makkar', 'Founding Partner', '👨‍💼', 'Capital Markets, Statutory Audits, Project Financing', '15+ years', 'FCA', 'Expert in capital markets and statutory audits with a strong financial background, assisting numerous SMEs with project financing from nationalised banks.', 0),
('CA Saurabh Madan', 'Senior Partner', '👨‍💼', 'Corporate Finance, Business Advisory, Financial Strategy', '13+ years', 'FCA', 'Corporate finance and advisory specialist, helping businesses navigate complex financial landscapes and achieve sustainable growth.', 1);
