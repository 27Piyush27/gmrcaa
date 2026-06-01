-- Create AI Knowledge Base table
CREATE TABLE ai_knowledge_base (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('general_context', 'strict_rule', 'faq')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE ai_knowledge_base ENABLE ROW LEVEL SECURITY;

-- Clients can read active knowledge (for chatbot context)
CREATE POLICY "Anyone can read active knowledge" 
    ON ai_knowledge_base FOR SELECT 
    USING (is_active = true);

-- Staff can do everything
CREATE POLICY "Staff can do everything with knowledge base" 
    ON ai_knowledge_base FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role IN ('admin', 'ca')
        )
    );

-- Add some default training data
INSERT INTO ai_knowledge_base (title, content, type, is_active) VALUES
('Default Office Hours', 'Our office is open from Monday to Saturday, 10:00 AM to 6:30 PM. We are closed on Sundays and public holidays.', 'general_context', true),
('Booking Rule', 'Always recommend booking an appointment if the user has complex tax issues that cannot be answered in 2 sentences.', 'strict_rule', true);
