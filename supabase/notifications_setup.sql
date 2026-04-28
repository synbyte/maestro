-- 1. Create Notifications Table (if not exists)
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type text NOT NULL, -- 'comment', 'reaction', 'message', 'milestone'
    title text NOT NULL,
    content text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure all required columns exist (in case table already existed)
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS type text;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS content text;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- 2. Enable RLS and Realtime
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications." ON public.notifications;
CREATE POLICY "Users can view their own notifications." ON public.notifications
    FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications." ON public.notifications;
CREATE POLICY "Users can update their own notifications." ON public.notifications
    FOR UPDATE USING ((select auth.uid()) = user_id);

-- Add to Realtime Publication (if not already added)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
END $$;

-- 3. Trigger for NEW COMMENTS
CREATE OR REPLACE FUNCTION public.handle_new_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
    post_owner_id uuid;
    commenter_name text;
BEGIN
    -- Get the post owner
    SELECT user_id INTO post_owner_id FROM public.posts WHERE id = NEW.post_id;
    
    -- Get commenter name
    SELECT display_name INTO commenter_name FROM public.profiles WHERE id = NEW.user_id;

    -- Only notify if commenter is not the post owner
    IF post_owner_id != NEW.user_id THEN
        INSERT INTO public.notifications (user_id, type, title, content, metadata)
        VALUES (
            post_owner_id, 
            'comment', 
            'New Comment!', 
            commenter_name || ' commented on your post: "' || LEFT(NEW.content, 50) || '..."',
            jsonb_build_object('post_id', NEW.post_id, 'comment_id', NEW.id)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_comment_created ON public.comments;
CREATE TRIGGER on_comment_created
    AFTER INSERT ON public.comments
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_comment_notification();

-- 4. Trigger for NEW REACTIONS
CREATE OR REPLACE FUNCTION public.handle_new_reaction_notification()
RETURNS TRIGGER AS $$
DECLARE
    post_owner_id uuid;
    reactor_name text;
BEGIN
    -- Get the post owner
    SELECT user_id INTO post_owner_id FROM public.posts WHERE id = NEW.post_id;
    
    -- Get reactor name
    SELECT display_name INTO reactor_name FROM public.profiles WHERE id = NEW.user_id;

    -- Only notify if reactor is not the post owner
    IF post_owner_id != NEW.user_id THEN
        INSERT INTO public.notifications (user_id, type, title, content, metadata)
        VALUES (
            post_owner_id, 
            'reaction', 
            'Post Reaction!', 
            reactor_name || ' reacted to your post with ' || NEW.reaction_type,
            jsonb_build_object('post_id', NEW.post_id, 'reaction_type', NEW.reaction_type)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_reaction_created ON public.reactions;
CREATE TRIGGER on_reaction_created
    AFTER INSERT ON public.reactions
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_reaction_notification();

-- 5. Trigger for NEW MESSAGES (Optional, since we listen to messages table directly, but good for persistence)
CREATE OR REPLACE FUNCTION public.handle_new_message_notification()
RETURNS TRIGGER AS $$
DECLARE
    sender_name text;
BEGIN
    -- Get sender name
    SELECT display_name INTO sender_name FROM public.profiles WHERE id = NEW.sender_id;

    INSERT INTO public.notifications (user_id, type, title, content, metadata)
    VALUES (
        NEW.recipient_id, 
        'message', 
        'New Message!', 
        'You have a new message from ' || sender_name,
        jsonb_build_object('sender_id', NEW.sender_id, 'message_id', NEW.id)
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_message_created ON public.messages;
CREATE TRIGGER on_message_created
    AFTER INSERT ON public.messages
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_message_notification();
