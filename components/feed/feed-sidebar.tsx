export function FeedSidebar() {
    return (
        <div className="w-full md:w-64 flex-shrink-0 space-y-8">
            <div>
                <h2 className="text-sm font-medium tracking-wide text-foreground uppercase mb-4">Trending</h2>
                <div className="space-y-3">
                    <TrendingTopic tag="#NextJS" posts="120" />
                    <TrendingTopic tag="#Supabase" posts="89" />
                    <TrendingTopic tag="#Cohort8" posts="45" />
                </div>
            </div>

            <div>
                <h2 className="text-sm font-medium tracking-wide text-foreground uppercase mb-4">Cohort Members</h2>
                <div className="space-y-3">
                    <CohortMember name="Alex Rivera" focus="AI Research" />
                    <CohortMember name="Emma Watson" focus="Frontend" />
                </div>
            </div>
        </div>
    );
}

function TrendingTopic({ tag, posts }: { tag: string; posts: string | number }) {
    return (
        <div className="flex justify-between items-center cursor-pointer group">
            <span className="text-sm text-muted group-hover:text-foreground transition-colors">{tag}</span>
            <span className="text-xs text-[#555]">{posts}</span>
        </div>
    );
}

function CohortMember({ name, focus }: { name: string; focus: string }) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex gap-2 items-center">
                <div className="w-6 h-6 rounded bg-[#333]" />
                <div>
                    <div className="text-sm text-foreground">{name}</div>
                    <div className="text-xs text-muted">{focus}</div>
                </div>
            </div>
        </div>
    );
}
